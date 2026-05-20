import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { scanPage, dashboardPage, newJobPage, jobDetailPage, stationViewPage, progressPage, loginPage, kpiPage, taktPage, adminPage } from "./ui";

// --- Types ---

type StationDef = {
  slug: string;
  name: string;
  level: "l1" | "l2" | "l3";
  seq: number;
  sets_status?: string;
};

type TenantConfig = {
  shop_type: string;
  entity_labels: { l1: string; l2: string; l3: string };
  stations: StationDef[];
  l3_statuses: string[];
  l3_terminal_status: string;
};

type UserRole = "user" | "lead" | "supervisor" | "admin";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type { TenantConfig, StationDef, UserRole, SessionUser };

// --- Shop Templates ---

const SHOP_TEMPLATES: Record<string, Omit<TenantConfig, "shop_type">> = {
  cabinet: {
    entity_labels: { l1: "Job", l2: "Bucket", l3: "Cabinet" },
    stations: [
      { slug: "receiving", name: "Receiving", level: "l1", seq: 1 },
      { slug: "kitting", name: "Kitting", level: "l1", seq: 2 },
      { slug: "cnc", name: "CNC", level: "l2", seq: 3 },
      { slug: "edge_banding", name: "Edge Banding", level: "l2", seq: 4 },
      { slug: "custom", name: "Custom", level: "l2", seq: 5 },
      { slug: "finishing", name: "Finishing", level: "l2", seq: 6 },
      { slug: "to_assembly", name: "To Assembly", level: "l2", seq: 7 },
      { slug: "assembly_start", name: "Assembly Start", level: "l3", seq: 8, sets_status: "assembling" },
      { slug: "assembly_complete", name: "Assembly Complete", level: "l3", seq: 9, sets_status: "assembled" },
      { slug: "staging", name: "Staging", level: "l3", seq: 10, sets_status: "staged" },
    ],
    l3_statuses: ["pending", "assembling", "assembled", "staged"],
    l3_terminal_status: "staged",
  },
  metal: {
    entity_labels: { l1: "Project", l2: "Batch", l3: "Part" },
    stations: [
      { slug: "intake", name: "Intake", level: "l1", seq: 1 },
      { slug: "cutting", name: "Cutting", level: "l2", seq: 2 },
      { slug: "welding", name: "Welding", level: "l2", seq: 3 },
      { slug: "grinding", name: "Grinding", level: "l2", seq: 4 },
      { slug: "coating", name: "Coating", level: "l3", seq: 5, sets_status: "coating" },
      { slug: "inspection", name: "Inspection", level: "l3", seq: 6, sets_status: "inspected" },
      { slug: "shipping", name: "Shipping", level: "l3", seq: 7, sets_status: "shipped" },
    ],
    l3_statuses: ["pending", "coating", "inspected", "shipped"],
    l3_terminal_status: "shipped",
  },
  wood: {
    entity_labels: { l1: "Order", l2: "Group", l3: "Piece" },
    stations: [
      { slug: "receiving", name: "Receiving", level: "l1", seq: 1 },
      { slug: "milling", name: "Milling", level: "l2", seq: 2 },
      { slug: "sanding", name: "Sanding", level: "l2", seq: 3 },
      { slug: "staining", name: "Staining", level: "l2", seq: 4 },
      { slug: "drying", name: "Drying", level: "l2", seq: 5 },
      { slug: "assembly", name: "Assembly", level: "l3", seq: 6, sets_status: "assembling" },
      { slug: "qc", name: "Quality Check", level: "l3", seq: 7, sets_status: "inspected" },
      { slug: "packing", name: "Packing", level: "l3", seq: 8, sets_status: "packed" },
    ],
    l3_statuses: ["pending", "assembling", "inspected", "packed"],
    l3_terminal_status: "packed",
  },
};

// --- Config Loading ---

let cachedConfig: TenantConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

async function loadConfig(db: D1Database): Promise<TenantConfig> {
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) return cachedConfig;

  const row = await db.prepare("SELECT * FROM config WHERE id = 1").first();
  if (!row) {
    const tpl = SHOP_TEMPLATES.cabinet;
    await db.prepare(
      "INSERT INTO config (id, shop_type, entity_labels, stations, l3_statuses, l3_terminal_status) VALUES (1,?,?,?,?,?)"
    ).bind(
      "cabinet",
      JSON.stringify(tpl.entity_labels),
      JSON.stringify(tpl.stations),
      JSON.stringify(tpl.l3_statuses),
      tpl.l3_terminal_status,
    ).run();
    cachedConfig = { shop_type: "cabinet", ...tpl };
  } else {
    cachedConfig = {
      shop_type: row.shop_type as string,
      entity_labels: JSON.parse(row.entity_labels as string),
      stations: JSON.parse(row.stations as string),
      l3_statuses: JSON.parse(row.l3_statuses as string),
      l3_terminal_status: row.l3_terminal_status as string,
    };
  }
  cacheTime = Date.now();
  return cachedConfig;
}

// --- Auth Helpers ---

const ROLE_LEVELS: Record<UserRole, number> = { user: 0, lead: 1, supervisor: 2, admin: 3 };
const SESSION_TTL_DAYS = 30;

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSessionUser(db: D1Database, sessionId: string | undefined): Promise<SessionUser | null> {
  if (!sessionId) return null;
  const row = await db.prepare(
    `SELECT u.id, u.name, u.email, u.role FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now') AND u.active = 1`
  ).bind(sessionId).first<SessionUser>();
  return row || null;
}

function hasRole(user: SessionUser | null, minRole: UserRole): boolean {
  if (!user) return false;
  return ROLE_LEVELS[user.role] >= ROLE_LEVELS[minRole];
}

// --- App ---

type Bindings = { DB: D1Database };
type Variables = { config: TenantConfig; user: SessionUser | null };
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());

app.use("*", async (c, next) => {
  const config = await loadConfig(c.env.DB);
  c.set("config", config);
  const sid = getCookie(c, "fw_session");
  const user = await getSessionUser(c.env.DB, sid);
  c.set("user", user);
  await next();
});

function requireAuth(minRole: UserRole = "user") {
  return async (c: any, next: any) => {
    const user = c.get("user") as SessionUser | null;
    if (!user) {
      if (c.req.path.startsWith("/api/")) return c.json({ error: "Not authenticated" }, 401);
      return c.redirect("/login");
    }
    if (!hasRole(user, minRole)) {
      if (c.req.path.startsWith("/api/")) return c.json({ error: "Insufficient role" }, 403);
      return c.redirect("/");
    }
    await next();
  };
}

app.get("/api/health", (c) => c.json({ status: "ok", service: "fabworks" }));

// --- Auth API ---

app.post("/api/auth/login", async (c) => {
  const { email, pin } = await c.req.json<{ email: string; pin: string }>();
  if (!email || !pin) return c.json({ error: "Email and PIN required" }, 400);

  const pinHash = await hashPin(pin);
  const user = await c.env.DB.prepare(
    "SELECT id, name, email, role FROM users WHERE email = ? COLLATE NOCASE AND pin = ? AND active = 1"
  ).bind(email.trim(), pinHash).first<SessionUser>();
  if (!user) return c.json({ error: "Invalid email or PIN" }, 401);

  const sid = generateSessionId();
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000).toISOString().replace("T", " ").slice(0, 19);
  await c.env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").bind(sid, user.id, expires).run();

  setCookie(c, "fw_session", sid, { path: "/", httpOnly: true, secure: true, sameSite: "Lax", maxAge: SESSION_TTL_DAYS * 86400 });
  return c.json({ user });
});

app.post("/api/auth/logout", async (c) => {
  const sid = getCookie(c, "fw_session");
  if (sid) {
    await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
    deleteCookie(c, "fw_session", { path: "/" });
  }
  return c.json({ ok: true });
});

app.get("/api/auth/me", (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Not authenticated" }, 401);
  return c.json(user);
});

// --- User Management (admin only) ---

app.get("/api/users", requireAuth("admin"), async (c) => {
  const result = await c.env.DB.prepare("SELECT id, name, email, role, active, created_at FROM users ORDER BY name").all();
  return c.json(result.results);
});

app.post("/api/users", requireAuth("admin"), async (c) => {
  const { name, email, pin, role } = await c.req.json<{ name: string; email: string; pin: string; role?: UserRole }>();
  if (!name || !email || !pin) return c.json({ error: "name, email, and pin required" }, 400);
  if (pin.length < 4) return c.json({ error: "PIN must be at least 4 characters" }, 400);

  const pinHash = await hashPin(pin);
  const result = await c.env.DB.prepare(
    "INSERT INTO users (name, email, pin, role) VALUES (?, ?, ?, ?) RETURNING id, name, email, role, active, created_at"
  ).bind(name.trim(), email.trim(), pinHash, role || "user").first();
  return c.json(result, 201);
});

app.put("/api/users/:id", requireAuth("admin"), async (c) => {
  const userId = c.req.param("id");
  const body = await c.req.json<{ name?: string; email?: string; pin?: string; role?: UserRole; active?: boolean }>();

  const updates: string[] = [];
  const binds: unknown[] = [];

  if (body.name) { updates.push("name = ?"); binds.push(body.name.trim()); }
  if (body.email) { updates.push("email = ?"); binds.push(body.email.trim()); }
  if (body.pin) {
    if (body.pin.length < 4) return c.json({ error: "PIN must be at least 4 characters" }, 400);
    updates.push("pin = ?"); binds.push(await hashPin(body.pin));
  }
  if (body.role) { updates.push("role = ?"); binds.push(body.role); }
  if (body.active !== undefined) { updates.push("active = ?"); binds.push(body.active ? 1 : 0); }

  if (updates.length === 0) return c.json({ error: "Nothing to update" }, 400);
  binds.push(userId);

  const result = await c.env.DB.prepare(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ? RETURNING id, name, email, role, active, created_at`
  ).bind(...binds).first();
  if (!result) return c.json({ error: "User not found" }, 404);
  return c.json(result);
});

// --- Config API ---

app.get("/api/config", (c) => c.json(c.get("config")));

app.put("/api/config", requireAuth("admin"), async (c) => {
  const body = await c.req.json<Partial<TenantConfig>>();
  const current = c.get("config");

  const updated = {
    shop_type: body.shop_type || current.shop_type,
    entity_labels: body.entity_labels || current.entity_labels,
    stations: body.stations || current.stations,
    l3_statuses: body.l3_statuses || current.l3_statuses,
    l3_terminal_status: body.l3_terminal_status || current.l3_terminal_status,
  };

  await c.env.DB.prepare(
    "UPDATE config SET shop_type=?, entity_labels=?, stations=?, l3_statuses=?, l3_terminal_status=?, updated_at=datetime('now') WHERE id=1"
  ).bind(
    updated.shop_type,
    JSON.stringify(updated.entity_labels),
    JSON.stringify(updated.stations),
    JSON.stringify(updated.l3_statuses),
    updated.l3_terminal_status,
  ).run();

  cachedConfig = null;
  return c.json(updated);
});

app.post("/api/config/reset", requireAuth("admin"), async (c) => {
  const { shop_type } = await c.req.json<{ shop_type: string }>();
  const tpl = SHOP_TEMPLATES[shop_type];
  if (!tpl) return c.json({ error: `Unknown shop type: ${shop_type}. Available: ${Object.keys(SHOP_TEMPLATES).join(", ")}` }, 400);

  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO config (id, shop_type, entity_labels, stations, l3_statuses, l3_terminal_status, updated_at) VALUES (1,?,?,?,?,?,datetime('now'))"
  ).bind(
    shop_type,
    JSON.stringify(tpl.entity_labels),
    JSON.stringify(tpl.stations),
    JSON.stringify(tpl.l3_statuses),
    tpl.l3_terminal_status,
  ).run();

  cachedConfig = null;
  return c.json({ shop_type, ...tpl });
});

// --- Stations ---

app.get("/api/stations", (c) => {
  const config = c.get("config");
  return c.json({ stations: config.stations, labels: config.entity_labels });
});

// --- Jobs ---

app.post("/api/jobs", async (c) => {
  const { job_number, job_name, cabinet_count } = await c.req.json<{
    job_number: string;
    job_name: string;
    cabinet_count?: number;
  }>();
  if (!job_number || !job_name) return c.json({ error: "job_number and job_name required" }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO jobs (job_number, job_name, cabinet_count) VALUES (?, ?, ?) RETURNING *"
  ).bind(job_number, job_name, cabinet_count || 0).first();
  return c.json(result, 201);
});

app.get("/api/jobs", async (c) => {
  const status = c.req.query("status") || "active";
  const result = await c.env.DB.prepare(
    "SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC"
  ).bind(status).all();
  return c.json(result.results);
});

app.get("/api/jobs/:id", async (c) => {
  const id = c.req.param("id");
  const job = await c.env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(id).first();
  if (!job) return c.json({ error: "Job not found" }, 404);

  const [buckets, cabinets, scans] = await Promise.all([
    c.env.DB.prepare("SELECT * FROM buckets WHERE job_id = ? ORDER BY created_at").bind(id).all(),
    c.env.DB.prepare("SELECT * FROM cabinets WHERE job_id = ? ORDER BY cabinet_number").bind(id).all(),
    c.env.DB.prepare(
      "SELECT * FROM scans WHERE job_id = ? ORDER BY scanned_at DESC"
    ).bind(id).all(),
  ]);

  return c.json({
    ...job,
    buckets: buckets.results,
    cabinets: cabinets.results,
    scans: scans.results,
  });
});

// --- Buckets ---

app.post("/api/jobs/:jobId/buckets", async (c) => {
  const jobId = c.req.param("jobId");
  const { name, cabinet_count } = await c.req.json<{
    name: string;
    cabinet_count?: number;
  }>();
  if (!name) return c.json({ error: "name required" }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO buckets (job_id, name, cabinet_count) VALUES (?, ?, ?) RETURNING *"
  ).bind(jobId, name, cabinet_count || 4).first();
  return c.json(result, 201);
});

app.get("/api/jobs/:jobId/buckets", async (c) => {
  const jobId = c.req.param("jobId");
  const result = await c.env.DB.prepare(
    "SELECT * FROM buckets WHERE job_id = ? ORDER BY created_at"
  ).bind(jobId).all();
  return c.json(result.results);
});

// --- Cabinets ---

app.post("/api/jobs/:jobId/cabinets", async (c) => {
  const jobId = c.req.param("jobId");
  const { cabinet_number, bucket_id, label } = await c.req.json<{
    cabinet_number: number;
    bucket_id?: number;
    label?: string;
  }>();
  if (!cabinet_number) return c.json({ error: "cabinet_number required" }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO cabinets (job_id, bucket_id, cabinet_number, label) VALUES (?, ?, ?, ?) RETURNING *"
  ).bind(jobId, bucket_id || null, cabinet_number, label || null).first();
  return c.json(result, 201);
});

app.get("/api/jobs/:jobId/cabinets", async (c) => {
  const jobId = c.req.param("jobId");
  const result = await c.env.DB.prepare(
    "SELECT c.*, b.name as bucket_name FROM cabinets c LEFT JOIN buckets b ON c.bucket_id = b.id WHERE c.job_id = ? ORDER BY c.cabinet_number"
  ).bind(jobId).all();
  return c.json(result.results);
});

// --- Scan (the core endpoint) ---

app.post("/api/scan", async (c) => {
  const config = c.get("config");
  const body = await c.req.json<{
    station: string;
    job_number?: string;
    job_id?: number;
    bucket_id?: number;
    cabinet_id?: number;
    scanned_by?: string;
    note?: string;
  }>();

  const stationDef = config.stations.find((s) => s.slug === body.station);
  if (!stationDef) {
    return c.json({ error: `Unknown station: ${body.station}` }, 400);
  }

  // Resolve job
  let jobId = body.job_id;
  let jobInfo: { id: number; job_number: string; job_name: string; status: string } | null = null;

  if (body.job_number) {
    jobInfo = await c.env.DB.prepare(
      "SELECT id, job_number, job_name, status FROM jobs WHERE job_number = ?"
    ).bind(body.job_number).first();
    if (!jobInfo) return c.json({ error: `Job ${body.job_number} not found` }, 404);
    jobId = jobInfo.id;
  } else if (jobId) {
    jobInfo = await c.env.DB.prepare(
      "SELECT id, job_number, job_name, status FROM jobs WHERE id = ?"
    ).bind(jobId).first();
    if (!jobInfo) return c.json({ error: `Job ID ${jobId} not found` }, 404);
  }

  if (!jobId || !jobInfo) return c.json({ error: "job_number or job_id required" }, 400);
  if (jobInfo.status !== "active") {
    return c.json({ error: `Job ${jobInfo.job_number} is ${jobInfo.status}` }, 400);
  }

  // Validate entity level
  if (stationDef.level === "l2" && !body.bucket_id) {
    return c.json({ error: `${stationDef.name} requires ${config.entity_labels.l2.toLowerCase()} selection` }, 400);
  }
  if (stationDef.level === "l3" && !body.cabinet_id) {
    return c.json({ error: `${stationDef.name} requires ${config.entity_labels.l3.toLowerCase()} selection` }, 400);
  }

  // L2 auto-progress on first scan
  if (stationDef.level === "l2" && body.bucket_id) {
    await c.env.DB.prepare(
      "UPDATE buckets SET status = 'in_progress' WHERE id = ? AND status = 'pending'"
    ).bind(body.bucket_id).run();
  }

  // L3 status transitions — data-driven via sets_status
  if (stationDef.level === "l3" && stationDef.sets_status && body.cabinet_id) {
    await c.env.DB.prepare("UPDATE cabinets SET status = ? WHERE id = ?")
      .bind(stationDef.sets_status, body.cabinet_id).run();

    // Check if parent L2 is now complete
    if (stationDef.sets_status === config.l3_terminal_status) {
      const cabinet = await c.env.DB.prepare(
        "SELECT bucket_id FROM cabinets WHERE id = ?"
      ).bind(body.cabinet_id).first<{ bucket_id: number | null }>();

      if (cabinet?.bucket_id) {
        const remaining = await c.env.DB.prepare(
          "SELECT COUNT(*) as cnt FROM cabinets WHERE bucket_id = ? AND status != ?"
        ).bind(cabinet.bucket_id, config.l3_terminal_status).first<{ cnt: number }>();

        if (remaining?.cnt === 0) {
          await c.env.DB.prepare("UPDATE buckets SET status = 'complete' WHERE id = ?")
            .bind(cabinet.bucket_id).run();
        }
      }
    }
  }

  const scan = await c.env.DB.prepare(
    `INSERT INTO scans (job_id, bucket_id, cabinet_id, station, scanned_by, note)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING id, scanned_at`
  ).bind(
    jobId,
    body.bucket_id || null,
    body.cabinet_id || null,
    body.station,
    body.scanned_by || null,
    body.note || null,
  ).first<{ id: number; scanned_at: string }>();

  return c.json({
    scan_id: scan!.id,
    job_number: jobInfo.job_number,
    job_name: jobInfo.job_name,
    station: stationDef.name,
    station_slug: body.station,
    level: stationDef.level,
    bucket_id: body.bucket_id || null,
    cabinet_id: body.cabinet_id || null,
    scanned_by: body.scanned_by || null,
    scanned_at: scan!.scanned_at,
  }, 201);
});

// --- Recent scans feed ---

app.get("/api/scans/recent", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "25"), 100);
  const result = await c.env.DB.prepare(
    `SELECT s.id, s.station, s.scanned_by, s.note, s.scanned_at,
            j.job_number, j.job_name,
            b.name as bucket_name,
            cab.cabinet_number, cab.label as cabinet_label
     FROM scans s
     JOIN jobs j ON s.job_id = j.id
     LEFT JOIN buckets b ON s.bucket_id = b.id
     LEFT JOIN cabinets cab ON s.cabinet_id = cab.id
     ORDER BY s.scanned_at DESC
     LIMIT ?`
  ).bind(limit).all();
  return c.json(result.results);
});

// --- Assembly metrics ---

app.get("/api/metrics/assembly", async (c) => {
  const config = c.get("config");
  const jobId = c.req.query("job_id");

  // Find the first two l3 stations with sets_status for timing
  const l3Stations = config.stations.filter((s) => s.level === "l3" && s.sets_status);
  const startStation = l3Stations[0]?.slug;
  const endStation = l3Stations[1]?.slug;
  if (!startStation || !endStation) return c.json([]);

  let whereClause = "";
  const binds: unknown[] = [endStation, startStation];

  if (jobId) {
    whereClause = "AND starts.job_id = ?";
    binds.push(jobId);
  }

  const result = await c.env.DB.prepare(
    `SELECT
       starts.cabinet_id,
       j.job_number,
       j.job_name,
       cab.cabinet_number,
       cab.label as cabinet_label,
       starts.scanned_by as assembler,
       starts.scanned_at as started_at,
       completes.scanned_at as completed_at,
       ROUND((julianday(completes.scanned_at) - julianday(starts.scanned_at)) * 1440, 1) as minutes
     FROM scans starts
     JOIN jobs j ON starts.job_id = j.id
     JOIN cabinets cab ON starts.cabinet_id = cab.id
     LEFT JOIN scans completes
       ON completes.cabinet_id = starts.cabinet_id
       AND completes.station = ?
       AND completes.scanned_at > starts.scanned_at
     WHERE starts.station = ? ${whereClause}
     ORDER BY starts.scanned_at DESC
     LIMIT 50`
  ).bind(...binds).all();
  return c.json(result.results);
});

// --- Assembler KPI ---

app.get("/api/kpi/assemblers", requireAuth("lead"), async (c) => {
  const config = c.get("config");
  const days = parseInt(c.req.query("days") || "30");

  const l3Stations = config.stations.filter((s) => s.level === "l3" && s.sets_status);
  const startStation = l3Stations[0]?.slug;
  const endStation = l3Stations[1]?.slug;
  if (!startStation || !endStation) return c.json({ assemblers: [], start_station: null, end_station: null });

  const result = await c.env.DB.prepare(
    `SELECT
       starts.scanned_by as assembler,
       COUNT(*) as total_started,
       COUNT(completes.id) as total_completed,
       ROUND(AVG(CASE WHEN completes.id IS NOT NULL
         THEN (julianday(completes.scanned_at) - julianday(starts.scanned_at)) * 1440
         END), 1) as avg_minutes,
       ROUND(MIN(CASE WHEN completes.id IS NOT NULL
         THEN (julianday(completes.scanned_at) - julianday(starts.scanned_at)) * 1440
         END), 1) as min_minutes,
       ROUND(MAX(CASE WHEN completes.id IS NOT NULL
         THEN (julianday(completes.scanned_at) - julianday(starts.scanned_at)) * 1440
         END), 1) as max_minutes,
       COUNT(DISTINCT DATE(starts.scanned_at)) as active_days,
       ROUND(CAST(COUNT(completes.id) AS REAL) / MAX(COUNT(DISTINCT DATE(starts.scanned_at)), 1), 1) as per_day
     FROM scans starts
     LEFT JOIN scans completes
       ON completes.cabinet_id = starts.cabinet_id
       AND completes.station = ?
       AND completes.scanned_at > starts.scanned_at
     WHERE starts.station = ?
       AND starts.scanned_by IS NOT NULL
       AND starts.scanned_by != ''
       AND starts.scanned_at >= datetime('now', '-' || ? || ' days')
     GROUP BY starts.scanned_by
     ORDER BY total_completed DESC`
  ).bind(endStation, startStation, days).all();

  const daily = await c.env.DB.prepare(
    `SELECT
       starts.scanned_by as assembler,
       DATE(starts.scanned_at) as day,
       COUNT(completes.id) as completed
     FROM scans starts
     LEFT JOIN scans completes
       ON completes.cabinet_id = starts.cabinet_id
       AND completes.station = ?
       AND completes.scanned_at > starts.scanned_at
     WHERE starts.station = ?
       AND starts.scanned_by IS NOT NULL
       AND starts.scanned_by != ''
       AND starts.scanned_at >= datetime('now', '-' || ? || ' days')
     GROUP BY starts.scanned_by, DATE(starts.scanned_at)
     ORDER BY day ASC`
  ).bind(endStation, startStation, days).all();

  const dailyByAssembler: Record<string, Array<{ day: string; completed: number }>> = {};
  for (const row of daily.results as Array<{ assembler: string; day: string; completed: number }>) {
    if (!dailyByAssembler[row.assembler]) dailyByAssembler[row.assembler] = [];
    dailyByAssembler[row.assembler].push({ day: row.day, completed: row.completed });
  }

  return c.json({
    assemblers: result.results,
    daily: dailyByAssembler,
    start_station: config.stations.find((s) => s.slug === startStation)?.name,
    end_station: config.stations.find((s) => s.slug === endStation)?.name,
    days,
  });
});

// --- Takt / Dwell Time ---

app.get("/api/kpi/takt", requireAuth("lead"), async (c) => {
  const config = c.get("config");
  const days = parseInt(c.req.query("days") || "30");

  type DwellRow = {
    station: string;
    next_station: string;
    level: string;
    entity_id: number;
    entity_label: string;
    job_number: string;
    scanned_at: string;
    next_scanned_at: string;
    dwell_minutes: number;
  };

  const results: DwellRow[] = [];

  for (const station of config.stations) {
    const sameLevel = config.stations.filter((s) => s.level === station.level && s.seq > station.seq);
    if (sameLevel.length === 0) continue;
    const nextStation = sameLevel[0];

    let entityCol: string;
    let entityJoin: string;
    let entityLabel: string;
    if (station.level === "l1") {
      entityCol = "job_id";
      entityJoin = "JOIN jobs j ON s1.job_id = j.id";
      entityLabel = "j.job_number || ' ' || j.job_name";
    } else if (station.level === "l2") {
      entityCol = "bucket_id";
      entityJoin = "JOIN buckets b ON s1.bucket_id = b.id JOIN jobs j ON b.job_id = j.id";
      entityLabel = "b.name";
    } else {
      entityCol = "cabinet_id";
      entityJoin = "JOIN cabinets cab ON s1.cabinet_id = cab.id JOIN jobs j ON cab.job_id = j.id";
      entityLabel = "'" + config.entity_labels.l3 + " ' || cab.cabinet_number";
    }

    const rows = await c.env.DB.prepare(
      `SELECT
         s1.station,
         ? as next_station,
         ? as level,
         s1.${entityCol} as entity_id,
         ${entityLabel} as entity_label,
         j.job_number,
         s1.scanned_at,
         s2.scanned_at as next_scanned_at,
         ROUND((julianday(s2.scanned_at) - julianday(s1.scanned_at)) * 1440, 1) as dwell_minutes
       FROM scans s1
       ${entityJoin}
       JOIN scans s2
         ON s2.${entityCol} = s1.${entityCol}
         AND s2.station = ?
         AND s2.scanned_at > s1.scanned_at
       WHERE s1.station = ?
         AND s1.${entityCol} IS NOT NULL
         AND s1.scanned_at >= datetime('now', '-' || ? || ' days')
       ORDER BY dwell_minutes DESC
       LIMIT 200`
    ).bind(nextStation.slug, station.level, nextStation.slug, station.slug, days).all();

    results.push(...(rows.results as DwellRow[]));
  }

  const stationStats: Record<string, {
    station: string;
    next_station: string;
    level: string;
    count: number;
    avg_minutes: number;
    min_minutes: number;
    max_minutes: number;
    p90_minutes: number;
  }> = {};

  for (const row of results) {
    if (!stationStats[row.station]) {
      stationStats[row.station] = {
        station: row.station,
        next_station: row.next_station,
        level: row.level,
        count: 0,
        avg_minutes: 0,
        min_minutes: Infinity,
        max_minutes: 0,
        p90_minutes: 0,
      };
    }
    const s = stationStats[row.station];
    s.count++;
    s.avg_minutes += row.dwell_minutes;
    if (row.dwell_minutes < s.min_minutes) s.min_minutes = row.dwell_minutes;
    if (row.dwell_minutes > s.max_minutes) s.max_minutes = row.dwell_minutes;
  }

  const stationDwells: Record<string, number[]> = {};
  for (const row of results) {
    if (!stationDwells[row.station]) stationDwells[row.station] = [];
    stationDwells[row.station].push(row.dwell_minutes);
  }

  const stations = Object.values(stationStats).map((s) => {
    s.avg_minutes = Math.round((s.avg_minutes / s.count) * 10) / 10;
    if (s.min_minutes === Infinity) s.min_minutes = 0;
    const sorted = (stationDwells[s.station] || []).sort((a, b) => a - b);
    s.p90_minutes = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.9)] : 0;
    return s;
  });

  const configStations = config.stations;
  stations.sort((a, b) => {
    const seqA = configStations.find((s) => s.slug === a.station)?.seq ?? 0;
    const seqB = configStations.find((s) => s.slug === b.station)?.seq ?? 0;
    return seqA - seqB;
  });

  const outliers = results
    .filter((r) => {
      const stat = stationStats[r.station];
      return stat && r.dwell_minutes > stat.avg_minutes * 2 && r.dwell_minutes > 30;
    })
    .slice(0, 20);

  const stationNames: Record<string, string> = {};
  config.stations.forEach((s) => { stationNames[s.slug] = s.name; });

  return c.json({ stations, outliers, station_names: stationNames, days });
});

// --- Station view ---

app.get("/api/stations/:slug/items", async (c) => {
  const config = c.get("config");
  const slug = c.req.param("slug");
  const stationDef = config.stations.find((s) => s.slug === slug);
  if (!stationDef) return c.json({ error: `Unknown station: ${slug}` }, 400);

  const laterStations = config.stations
    .filter((s) => s.level === stationDef.level && s.seq > stationDef.seq)
    .map((s) => s.slug);

  const laterPlaceholders = laterStations.map(() => "?").join(",");

  if (stationDef.level === "l1") {
    const query = laterStations.length > 0
      ? `SELECT DISTINCT j.id, j.job_number, j.job_name, j.cabinet_count, s.scanned_at
         FROM jobs j
         JOIN scans s ON s.job_id = j.id AND s.station = ?
         WHERE j.status = 'active'
         AND NOT EXISTS (SELECT 1 FROM scans s2 WHERE s2.job_id = j.id AND s2.station IN (${laterPlaceholders}))
         ORDER BY s.scanned_at DESC`
      : `SELECT DISTINCT j.id, j.job_number, j.job_name, j.cabinet_count, s.scanned_at
         FROM jobs j
         JOIN scans s ON s.job_id = j.id AND s.station = ?
         WHERE j.status = 'active'
         ORDER BY s.scanned_at DESC`;
    const result = await c.env.DB.prepare(query).bind(slug, ...laterStations).all();
    return c.json({ level: "l1", items: result.results });
  }

  if (stationDef.level === "l2") {
    const query = laterStations.length > 0
      ? `SELECT DISTINCT b.id, b.name, b.cabinet_count, b.status, j.id as job_id, j.job_number, j.job_name, s.scanned_at
         FROM buckets b
         JOIN jobs j ON b.job_id = j.id
         JOIN scans s ON s.bucket_id = b.id AND s.station = ?
         WHERE j.status = 'active'
         AND NOT EXISTS (SELECT 1 FROM scans s2 WHERE s2.bucket_id = b.id AND s2.station IN (${laterPlaceholders}))
         ORDER BY s.scanned_at DESC`
      : `SELECT DISTINCT b.id, b.name, b.cabinet_count, b.status, j.id as job_id, j.job_number, j.job_name, s.scanned_at
         FROM buckets b
         JOIN jobs j ON b.job_id = j.id
         JOIN scans s ON s.bucket_id = b.id AND s.station = ?
         WHERE j.status = 'active'
         ORDER BY s.scanned_at DESC`;
    const result = await c.env.DB.prepare(query).bind(slug, ...laterStations).all();
    return c.json({ level: "l2", items: result.results });
  }

  // l3 level
  const query = laterStations.length > 0
    ? `SELECT DISTINCT cab.id, cab.cabinet_number, cab.label, cab.status, b.name as bucket_name, j.id as job_id, j.job_number, j.job_name, s.scanned_at
       FROM cabinets cab
       JOIN jobs j ON cab.job_id = j.id
       LEFT JOIN buckets b ON cab.bucket_id = b.id
       JOIN scans s ON s.cabinet_id = cab.id AND s.station = ?
       WHERE j.status = 'active'
       AND NOT EXISTS (SELECT 1 FROM scans s2 WHERE s2.cabinet_id = cab.id AND s2.station IN (${laterPlaceholders}))
       ORDER BY s.scanned_at DESC`
    : `SELECT DISTINCT cab.id, cab.cabinet_number, cab.label, cab.status, b.name as bucket_name, j.id as job_id, j.job_number, j.job_name, s.scanned_at
       FROM cabinets cab
       JOIN jobs j ON cab.job_id = j.id
       LEFT JOIN buckets b ON cab.bucket_id = b.id
       JOIN scans s ON s.cabinet_id = cab.id AND s.station = ?
       WHERE j.status = 'active'
       ORDER BY s.scanned_at DESC`;
  const result = await c.env.DB.prepare(query).bind(slug, ...laterStations).all();
  return c.json({ level: "l3", items: result.results });
});

// --- Pages ---

app.get("/login", (c) => {
  if (c.get("user")) return c.redirect("/");
  return c.html(loginPage());
});
app.get("/", requireAuth(), (c) => c.html(scanPage(c.get("config"), c.get("user")!)));
app.get("/jobs/new", requireAuth(), (c) => c.html(newJobPage(c.get("config"))));
app.get("/dashboard", requireAuth(), (c) => c.html(dashboardPage(c.get("config"))));
app.get("/job/:id", requireAuth(), (c) => c.html(jobDetailPage(c.get("config"))));
app.get("/stations", requireAuth(), (c) => c.html(stationViewPage(c.get("config"))));
app.get("/job/:id/progress", requireAuth(), (c) => c.html(progressPage(c.get("config"))));
app.get("/kpi", requireAuth("lead"), (c) => c.html(kpiPage(c.get("config"))));
app.get("/takt", requireAuth("lead"), (c) => c.html(taktPage(c.get("config"))));
app.get("/admin", requireAuth("admin"), (c) => c.html(adminPage(c.get("config"))));

export default app;
