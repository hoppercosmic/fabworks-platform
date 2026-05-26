// Asana integration — webhook ingestion, API client, bidirectional sync engine

export type AsanaEvent = {
  resource: { gid: string; resource_type: string; resource_subtype?: string };
  parent: { gid: string; resource_type: string } | null;
  action: "changed" | "added" | "removed" | "deleted" | "undeleted";
  type: string;
  created_at: string;
  change?: { field: string; action: string; new_value?: unknown; added_value?: unknown; removed_value?: unknown };
};

export type AsanaWebhookPayload = {
  events: AsanaEvent[];
};

type AsanaMapping = {
  id: number;
  fw_type: string;
  fw_id: number;
  asana_gid: string;
  asana_type: string;
};

// --- Webhook signature verification ---

const encoder = new TextEncoder();

export async function verifyWebhookSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

export async function storeWebhook(db: D1Database, webhookGid: string, resourceGid: string, secret: string): Promise<void> {
  await db.prepare("INSERT INTO asana_webhooks (webhook_gid, resource_gid, hook_secret) VALUES (?, ?, ?) ON CONFLICT(webhook_gid) DO UPDATE SET hook_secret = ?, active = 1")
    .bind(webhookGid, resourceGid, secret, secret).run();
}

export async function getWebhookSecret(db: D1Database): Promise<string | null> {
  const row = await db.prepare("SELECT hook_secret FROM asana_webhooks WHERE active = 1 ORDER BY id DESC LIMIT 1").first<{ hook_secret: string }>();
  return row?.hook_secret ?? null;
}

// --- Asana REST API client ---

const ASANA_BASE = "https://app.asana.com/api/1.0";

async function asanaFetch(pat: string, path: string, opts: { method?: string; body?: unknown } = {}): Promise<{ data: any }> {
  const res = await fetch(`${ASANA_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Authorization": `Bearer ${pat}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: opts.body ? JSON.stringify({ data: opts.body }) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asana API ${res.status}: ${text}`);
  }
  return res.json() as Promise<{ data: any }>;
}

export async function completeAsanaTask(pat: string, taskGid: string): Promise<void> {
  await asanaFetch(pat, `/tasks/${taskGid}`, { method: "PUT", body: { completed: true } });
}

export async function createAsanaTask(pat: string, projectGid: string, sectionGid: string, name: string, notes: string): Promise<string> {
  const result = await asanaFetch(pat, `/tasks`, {
    method: "POST",
    body: { name, notes, projects: [projectGid] },
  });
  const taskGid = result.data.gid;
  await asanaFetch(pat, `/sections/${sectionGid}/addTask`, {
    method: "POST",
    body: { task: taskGid },
  });
  return taskGid;
}

export async function getAsanaSections(pat: string, projectGid: string): Promise<{ gid: string; name: string }[]> {
  const result = await asanaFetch(pat, `/projects/${projectGid}/sections`);
  return result.data;
}

export async function getAsanaTask(pat: string, taskGid: string): Promise<{ gid: string; name: string; completed: boolean; memberships: { section: { gid: string; name: string } }[] }> {
  const result = await asanaFetch(pat, `/tasks/${taskGid}?opt_fields=name,completed,memberships.section.name`);
  return result.data;
}

export async function registerAsanaWebhook(pat: string, resourceGid: string, targetUrl: string): Promise<{ gid: string }> {
  const result = await asanaFetch(pat, `/webhooks`, {
    method: "POST",
    body: { resource: resourceGid, target: targetUrl, filters: [{ resource_type: "task", action: "changed" }] },
  });
  return result.data;
}

// --- Entity mapping (FabWorks ↔ Asana) ---

export async function storeMapping(db: D1Database, fwType: string, fwId: number, asanaGid: string, asanaType: string): Promise<void> {
  await db.prepare("INSERT INTO asana_mappings (fw_type, fw_id, asana_gid, asana_type) VALUES (?, ?, ?, ?) ON CONFLICT(fw_type, fw_id) DO UPDATE SET asana_gid = ?, asana_type = ?")
    .bind(fwType, fwId, asanaGid, asanaType, asanaGid, asanaType).run();
}

export async function getMappingByAsanaGid(db: D1Database, asanaGid: string): Promise<AsanaMapping | null> {
  return db.prepare("SELECT id, fw_type, fw_id, asana_gid, asana_type FROM asana_mappings WHERE asana_gid = ?")
    .bind(asanaGid).first<AsanaMapping>();
}

export async function getMappingByFwEntity(db: D1Database, fwType: string, fwId: number): Promise<AsanaMapping | null> {
  return db.prepare("SELECT id, fw_type, fw_id, asana_gid, asana_type FROM asana_mappings WHERE fw_type = ? AND fw_id = ?")
    .bind(fwType, fwId).first<AsanaMapping>();
}

export async function getProjectMapping(db: D1Database, jobId: number): Promise<AsanaMapping | null> {
  return getMappingByFwEntity(db, "job", jobId);
}

// --- Event queue ---

export async function enqueueEvents(db: D1Database, webhookGid: string, events: AsanaEvent[]): Promise<number> {
  let count = 0;
  for (const event of events) {
    const resourceGid = event.resource?.gid ?? "unknown";
    const eventType = event.resource?.resource_type ?? event.type ?? "unknown";
    const action = event.action ?? "unknown";
    await db.prepare("INSERT INTO asana_event_queue (webhook_gid, event_type, resource_gid, action, payload) VALUES (?, ?, ?, ?, ?)")
      .bind(webhookGid, eventType, resourceGid, action, JSON.stringify(event)).run();
    count++;
  }
  return count;
}

// --- Inbound sync (Asana → FabWorks) ---

async function handleTaskCompleted(db: D1Database, resourceGid: string, event: AsanaEvent): Promise<void> {
  const change = event.change;
  if (!change || change.field !== "completed" || change.new_value !== true) return;

  const mapping = await getMappingByAsanaGid(db, resourceGid);
  if (!mapping) return;

  if (mapping.fw_type === "bucket") {
    await db.prepare("UPDATE buckets SET status = 'complete' WHERE id = ? AND status != 'complete'")
      .bind(mapping.fw_id).run();
  } else if (mapping.fw_type === "cabinet") {
    const cab = await db.prepare("SELECT id, job_id FROM cabinets WHERE id = ?").bind(mapping.fw_id).first<{ id: number; job_id: number }>();
    if (!cab) return;
    const config = await db.prepare("SELECT l3_terminal_status FROM config ORDER BY id DESC LIMIT 1").first<{ l3_terminal_status: string }>();
    const terminalStatus = config?.l3_terminal_status ?? "staged";
    await db.prepare("UPDATE cabinets SET status = ? WHERE id = ? AND status != ?")
      .bind(terminalStatus, mapping.fw_id, terminalStatus).run();
  }
}

export async function processEventQueue(db: D1Database): Promise<{ processed: number; failed: number }> {
  const rows = await db.prepare("SELECT id, event_type, resource_gid, action, payload FROM asana_event_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 50").all<{
    id: number; event_type: string; resource_gid: string; action: string; payload: string;
  }>();

  let processed = 0;
  let failed = 0;

  for (const row of rows.results) {
    try {
      const event: AsanaEvent = JSON.parse(row.payload);

      if (row.event_type === "task" && row.action === "changed") {
        await handleTaskCompleted(db, row.resource_gid, event);
      }

      await db.prepare("UPDATE asana_event_queue SET status = 'processed', processed_at = datetime('now') WHERE id = ?").bind(row.id).run();
      processed++;
    } catch {
      await db.prepare("UPDATE asana_event_queue SET status = CASE WHEN retry_count >= 3 THEN 'failed' ELSE 'pending' END, retry_count = retry_count + 1 WHERE id = ?").bind(row.id).run();
      failed++;
    }
  }

  return { processed, failed };
}

// --- Outbound sync helpers ---

export async function syncScanToAsana(db: D1Database, pat: string, fwType: "bucket" | "cabinet", fwId: number): Promise<void> {
  const mapping = await getMappingByFwEntity(db, fwType, fwId);
  if (!mapping) return;
  await completeAsanaTask(pat, mapping.asana_gid);
}

export async function syncFixitToAsana(db: D1Database, pat: string, jobId: number, cabinetLabel: string, rootCause: string, description: string): Promise<string | null> {
  const projectMapping = await getProjectMapping(db, jobId);
  if (!projectMapping) return null;

  const sections = await getAsanaSections(pat, projectMapping.asana_gid);
  const cncSection = sections.find((s: { name: string }) => s.name.toLowerCase().includes("cnc"));
  if (!cncSection) return null;

  const taskName = `REWORK: ${cabinetLabel} - ${rootCause}`;
  const taskGid = await createAsanaTask(pat, projectMapping.asana_gid, cncSection.gid, taskName, description);
  return taskGid;
}

// --- Queue status ---

export async function getQueueStatus(db: D1Database): Promise<{ pending: number; processed: number; failed: number; recent: unknown[] }> {
  const counts = await db.prepare("SELECT status, COUNT(*) as count FROM asana_event_queue GROUP BY status").all<{ status: string; count: number }>();
  const statusMap: Record<string, number> = {};
  for (const row of counts.results) statusMap[row.status] = row.count;

  const recent = await db.prepare("SELECT id, webhook_gid, event_type, resource_gid, action, status, retry_count, created_at, processed_at FROM asana_event_queue ORDER BY created_at DESC LIMIT 20").all();

  return {
    pending: statusMap["pending"] ?? 0,
    processed: statusMap["processed"] ?? 0,
    failed: statusMap["failed"] ?? 0,
    recent: recent.results,
  };
}

export async function getWebhookStatus(db: D1Database): Promise<{ webhooks: { webhook_gid: string; resource_gid: string; active: boolean; created_at: string }[] }> {
  const rows = await db.prepare("SELECT webhook_gid, resource_gid, active, created_at FROM asana_webhooks ORDER BY created_at DESC").all<{
    webhook_gid: string; resource_gid: string; active: number; created_at: string;
  }>();
  return {
    webhooks: rows.results.map(r => ({ ...r, active: r.active === 1 })),
  };
}
