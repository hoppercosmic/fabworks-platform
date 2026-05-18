import { Hono } from "hono";
import { cors } from "hono/cors";
import { scanPage, dashboardPage, newJobPage, jobDetailPage, stationViewPage } from "./ui";

type Bindings = { DB: D1Database };
const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

const STATIONS = {
  receiving:         { name: "Receiving",         level: "job",     seq: 1 },
  kitting:           { name: "Kitting",           level: "job",     seq: 2 },
  cnc:               { name: "CNC",               level: "bucket",  seq: 3 },
  edge_banding:      { name: "Edge Banding",      level: "bucket",  seq: 4 },
  custom:            { name: "Custom",            level: "bucket",  seq: 5 },
  finishing:         { name: "Finishing",          level: "bucket",  seq: 6 },
  to_assembly:       { name: "To Assembly",       level: "bucket",  seq: 7 },
  assembly_start:    { name: "Assembly Start",    level: "cabinet", seq: 8 },
  assembly_complete: { name: "Assembly Complete",  level: "cabinet", seq: 9 },
  staging:           { name: "Staging",           level: "cabinet", seq: 10 },
} as const;

type StationSlug = keyof typeof STATIONS;

app.get("/api/health", (c) => c.json({ status: "ok", service: "fabworks" }));

app.get("/api/stations", (c) => {
  const list = Object.entries(STATIONS).map(([slug, s]) => ({
    slug, ...s,
  }));
  return c.json(list);
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
  const body = await c.req.json<{
    station: string;
    job_number?: string;
    job_id?: number;
    bucket_id?: number;
    cabinet_id?: number;
    scanned_by?: string;
    note?: string;
  }>();

  const station = body.station as StationSlug;
  if (!STATIONS[station]) {
    return c.json({ error: `Unknown station: ${body.station}` }, 400);
  }

  const stationDef = STATIONS[station];

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
  if (stationDef.level === "bucket" && !body.bucket_id) {
    return c.json({ error: `${stationDef.name} requires bucket_id` }, 400);
  }
  if (stationDef.level === "cabinet" && !body.cabinet_id) {
    return c.json({ error: `${stationDef.name} requires cabinet_id` }, 400);
  }

  // Update bucket status on first bucket-level scan
  if (stationDef.level === "bucket" && body.bucket_id) {
    await c.env.DB.prepare(
      "UPDATE buckets SET status = 'in_progress' WHERE id = ? AND status = 'pending'"
    ).bind(body.bucket_id).run();
  }

  // Update cabinet status for assembly scans
  if (station === "assembly_start" && body.cabinet_id) {
    await c.env.DB.prepare("UPDATE cabinets SET status = 'assembling' WHERE id = ?")
      .bind(body.cabinet_id).run();
  } else if (station === "assembly_complete" && body.cabinet_id) {
    await c.env.DB.prepare("UPDATE cabinets SET status = 'assembled' WHERE id = ?")
      .bind(body.cabinet_id).run();
  } else if (station === "staging" && body.cabinet_id) {
    await c.env.DB.prepare("UPDATE cabinets SET status = 'staged' WHERE id = ?")
      .bind(body.cabinet_id).run();

    const cabinet = await c.env.DB.prepare(
      "SELECT bucket_id FROM cabinets WHERE id = ?"
    ).bind(body.cabinet_id).first<{ bucket_id: number | null }>();

    if (cabinet?.bucket_id) {
      const remaining = await c.env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM cabinets WHERE bucket_id = ? AND status != 'staged'"
      ).bind(cabinet.bucket_id).first<{ cnt: number }>();

      if (remaining?.cnt === 0) {
        await c.env.DB.prepare(
          "UPDATE buckets SET status = 'complete' WHERE id = ?"
        ).bind(cabinet.bucket_id).run();
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
    station,
    body.scanned_by || null,
    body.note || null,
  ).first<{ id: number; scanned_at: string }>();

  return c.json({
    scan_id: scan!.id,
    job_number: jobInfo.job_number,
    job_name: jobInfo.job_name,
    station: stationDef.name,
    station_slug: station,
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
  const jobId = c.req.query("job_id");
  let whereClause = "";
  const binds: unknown[] = [];

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
       AND completes.station = 'assembly_complete'
       AND completes.scanned_at > starts.scanned_at
     WHERE starts.station = 'assembly_start' ${whereClause}
     ORDER BY starts.scanned_at DESC
     LIMIT 50`
  ).bind(...binds).all();
  return c.json(result.results);
});

// --- Station view ---

app.get("/api/stations/:slug/items", async (c) => {
  const slug = c.req.param("slug") as StationSlug;
  const stationDef = STATIONS[slug];
  if (!stationDef) return c.json({ error: `Unknown station: ${slug}` }, 400);

  const laterStations = Object.entries(STATIONS)
    .filter(([, s]) => s.level === stationDef.level && s.seq > stationDef.seq)
    .map(([k]) => k);

  const laterPlaceholders = laterStations.map(() => "?").join(",");

  if (stationDef.level === "job") {
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
    return c.json({ level: "job", items: result.results });
  }

  if (stationDef.level === "bucket") {
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
    return c.json({ level: "bucket", items: result.results });
  }

  // cabinet level
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
  return c.json({ level: "cabinet", items: result.results });
});

// --- Pages ---

app.get("/", (c) => c.html(scanPage));
app.get("/jobs/new", (c) => c.html(newJobPage));
app.get("/dashboard", (c) => c.html(dashboardPage));
app.get("/job/:id", (c) => c.html(jobDetailPage));
app.get("/stations", (c) => c.html(stationViewPage));

export default app;
