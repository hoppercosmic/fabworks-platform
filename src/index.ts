import { Hono } from "hono";
import { cors } from "hono/cors";
import { scanPage, dashboardPage } from "./ui";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", service: "fabworks" });
});

// List all stations
app.get("/api/stations", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, slug, name, sequence FROM stations ORDER BY sequence"
  ).all();
  return c.json(result.results);
});

// Create a job
app.post("/api/jobs", async (c) => {
  const body = await c.req.json<{
    job_number: string;
    job_name: string;
    routing?: string;
  }>();

  if (!body.job_number || !body.job_name) {
    return c.json({ error: "job_number and job_name required" }, 400);
  }

  const routing = body.routing || "standard";
  const validRoutes = ["standard", "custom_then_finish", "finish_only"];
  if (!validRoutes.includes(routing)) {
    return c.json({ error: `routing must be one of: ${validRoutes.join(", ")}` }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO jobs (job_number, job_name, routing) VALUES (?, ?, ?) RETURNING *"
  )
    .bind(body.job_number, body.job_name, routing)
    .first();

  return c.json(result, 201);
});

// List jobs
app.get("/api/jobs", async (c) => {
  const status = c.req.query("status") || "active";
  const result = await c.env.DB.prepare(
    "SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC"
  ).bind(status).all();
  return c.json(result.results);
});

// Get a single job with its scan history
app.get("/api/jobs/:id", async (c) => {
  const id = c.req.param("id");
  const job = await c.env.DB.prepare("SELECT * FROM jobs WHERE id = ?")
    .bind(id)
    .first();

  if (!job) return c.json({ error: "Job not found" }, 404);

  const scans = await c.env.DB.prepare(
    `SELECT s.id, s.scanned_by, s.note, s.scanned_at,
            st.slug as station, st.name as station_name, st.sequence
     FROM scans s
     JOIN stations st ON s.station_id = st.id
     WHERE s.job_id = ?
     ORDER BY s.scanned_at ASC`
  ).bind(id).all();

  return c.json({ ...job, scans: scans.results });
});

// Record a scan — the core endpoint
app.post("/api/scan", async (c) => {
  const body = await c.req.json<{
    job_number: string;
    station: string;
    scanned_by?: string;
    note?: string;
  }>();

  if (!body.job_number || !body.station) {
    return c.json({ error: "job_number and station required" }, 400);
  }

  const job = await c.env.DB.prepare(
    "SELECT id, job_number, job_name, routing, status FROM jobs WHERE job_number = ?"
  ).bind(body.job_number).first<{
    id: number;
    job_number: string;
    job_name: string;
    routing: string;
    status: string;
  }>();

  if (!job) return c.json({ error: `Job ${body.job_number} not found` }, 404);
  if (job.status !== "active") {
    return c.json({ error: `Job ${body.job_number} is ${job.status}` }, 400);
  }

  const station = await c.env.DB.prepare(
    "SELECT id, slug, name, sequence FROM stations WHERE slug = ?"
  ).bind(body.station).first<{
    id: number;
    slug: string;
    name: string;
    sequence: number;
  }>();

  if (!station) return c.json({ error: `Station "${body.station}" not found` }, 404);

  const scan = await c.env.DB.prepare(
    `INSERT INTO scans (job_id, station_id, scanned_by, note)
     VALUES (?, ?, ?, ?)
     RETURNING id, scanned_at`
  )
    .bind(job.id, station.id, body.scanned_by || null, body.note || null)
    .first<{ id: number; scanned_at: string }>();

  return c.json(
    {
      scan_id: scan!.id,
      job_number: job.job_number,
      job_name: job.job_name,
      station: station.name,
      scanned_by: body.scanned_by || null,
      scanned_at: scan!.scanned_at,
    },
    201
  );
});

app.get("/", (c) => c.html(scanPage));
app.get("/dashboard", (c) => c.html(dashboardPage));

export default app;
