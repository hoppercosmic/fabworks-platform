import { Hono } from "hono";
import { cors } from "hono/cors";
import { scanPage, dashboardPage, newJobPage, jobDetailPage, stationViewPage } from "./ui";

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

export type { TenantConfig, StationDef };

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

// --- App ---

type Bindings = { DB: D1Database };
type Variables = { config: TenantConfig };
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());

app.use("*", async (c, next) => {
  const config = await loadConfig(c.env.DB);
  c.set("config", config);
  await next();
});

app.get("/api/health", (c) => c.json({ status: "ok", service: "fabworks" }));

// --- Config API ---

app.get("/api/config", (c) => c.json(c.get("config")));

app.put("/api/config", async (c) => {
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

app.post("/api/config/reset", async (c) => {
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

app.get("/", (c) => c.html(scanPage(c.get("config"))));
app.get("/jobs/new", (c) => c.html(newJobPage(c.get("config"))));
app.get("/dashboard", (c) => c.html(dashboardPage(c.get("config"))));
app.get("/job/:id", (c) => c.html(jobDetailPage(c.get("config"))));
app.get("/stations", (c) => c.html(stationViewPage(c.get("config"))));

export default app;
