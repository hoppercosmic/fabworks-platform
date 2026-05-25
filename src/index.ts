import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { scanPage, dashboardPage, newJobPage, jobDetailPage, stationViewPage, progressPage, loginPage, kpiPage, taktPage, adminPage, workbenchPage, fixitPage, myWorkbenchPage, qrPage, stationMenuPage, profilePage, stagingPage, cabinetDetailPage, reportsPage } from "./ui/index";
import { SERVICE_WORKER_JS } from "./offline";

// --- Types ---

type StationDef = {
  slug: string;
  name: string;
  level: "l1" | "l2" | "l3";
  seq: number;
  sets_status?: string;
};

type StationMenu = {
  slug: string;
  name: string;
  icon: string;
  station_slugs: string[];
  features: string[];
  minRole: UserRole;
};

type PartPropertyDef = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  unit?: string;
  options?: string[];
  group?: string;
};

type TenantConfig = {
  shop_type: string;
  entity_labels: { l1: string; l2: string; l3: string };
  stations: StationDef[];
  l3_statuses: string[];
  l3_terminal_status: string;
  station_menus: StationMenu[];
  part_properties: PartPropertyDef[];
};

type UserRole = "user" | "lead" | "supervisor" | "admin";

type HomePage = "scan" | "workbench" | "fixit" | "staging" | "dashboard";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  home_page: HomePage;
};

export type { TenantConfig, StationDef, StationMenu, PartPropertyDef, UserRole, SessionUser };

// --- Shop Templates ---

const SHOP_TEMPLATES: Record<string, Omit<TenantConfig, "shop_type">> = {
  cabinet: {
    entity_labels: { l1: "Job", l2: "Bucket", l3: "Cabinet" },
    stations: [
      { slug: "shop_floor", name: "Shop Floor", level: "l1", seq: 1 },
      { slug: "cnc_eb", name: "CNC/EB", level: "l2", seq: 2 },
      { slug: "custom", name: "Custom", level: "l2", seq: 3 },
      { slug: "finishing", name: "Finishing", level: "l2", seq: 4 },
      { slug: "assembly", name: "Assembly", level: "l3", seq: 5, sets_status: "assembling" },
      { slug: "staging", name: "Staging", level: "l3", seq: 6, sets_status: "staged" },
    ],
    l3_statuses: ["pending", "assembling", "staged"],
    l3_terminal_status: "staged",
    station_menus: [
      { slug: "cnc_eb", name: "CNC/EB", icon: "cpu", station_slugs: ["cnc_eb"], features: ["notes"], minRole: "user" },
      { slug: "assembly", name: "Assembly", icon: "wrench", station_slugs: ["assembly"], features: ["notes"], minRole: "user" },
      { slug: "finishing", name: "Finishing", icon: "paint", station_slugs: ["finishing"], features: ["notes"], minRole: "user" },
      { slug: "custom", name: "Custom", icon: "tool", station_slugs: ["custom"], features: ["notes"], minRole: "user" },
      { slug: "waterspider", name: "WS", icon: "flow", station_slugs: ["staging"], features: ["notes"], minRole: "user" },
      { slug: "warehouse", name: "Warehouse", icon: "box", station_slugs: ["shop_floor"], features: ["notes"], minRole: "user" },
    ],
    part_properties: [
      { key: "width", label: "Width", type: "number", unit: "in", group: "Dimensions" },
      { key: "height", label: "Height", type: "number", unit: "in", group: "Dimensions" },
      { key: "depth", label: "Depth", type: "number", unit: "in", group: "Dimensions" },
      { key: "material", label: "Material", type: "select", options: ["Maple", "Cherry", "Oak", "MDF", "Plywood", "Melamine"], group: "Materials" },
      { key: "finish", label: "Finish", type: "select", options: ["Natural", "Stain", "Paint", "Lacquer", "Thermofoil"], group: "Materials" },
      { key: "edge_banding", label: "Edge Banding", type: "select", options: ["None", "PVC", "Wood", "Veneer", "ABS"], group: "Materials" },
      { key: "hardware", label: "Hardware", type: "text", group: "Hardware" },
    ],
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
    station_menus: [
      { slug: "fab", name: "Fab", icon: "wrench", station_slugs: ["cutting", "welding", "grinding"], features: ["kpi", "takt", "notes"], minRole: "user" },
      { slug: "finish", name: "Finish", icon: "paint", station_slugs: ["coating", "inspection"], features: ["kpi", "notes"], minRole: "user" },
      { slug: "shipping", name: "Ship", icon: "box", station_slugs: ["shipping"], features: ["notes"], minRole: "user" },
    ],
    part_properties: [
      { key: "width", label: "Width", type: "number", unit: "in", group: "Dimensions" },
      { key: "height", label: "Height", type: "number", unit: "in", group: "Dimensions" },
      { key: "length", label: "Length", type: "number", unit: "in", group: "Dimensions" },
      { key: "gauge", label: "Gauge", type: "select", options: ["10", "12", "14", "16", "18", "20"], group: "Materials" },
      { key: "material_type", label: "Material", type: "select", options: ["Steel", "Aluminum", "Stainless", "Galvanized"], group: "Materials" },
      { key: "weld_type", label: "Weld Type", type: "select", options: ["MIG", "TIG", "Stick", "Spot"], group: "Process" },
      { key: "surface_treatment", label: "Surface", type: "select", options: ["Powder Coat", "Paint", "Anodize", "Raw", "Galvanize"], group: "Process" },
    ],
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
    station_menus: [
      { slug: "mill", name: "Mill", icon: "cpu", station_slugs: ["milling", "sanding"], features: ["kpi", "takt", "notes"], minRole: "user" },
      { slug: "finish", name: "Finish", icon: "paint", station_slugs: ["staining", "drying"], features: ["kpi", "notes"], minRole: "user" },
      { slug: "assembly", name: "Assembly", icon: "wrench", station_slugs: ["assembly", "qc", "packing"], features: ["kpi", "takt", "notes"], minRole: "user" },
    ],
    part_properties: [
      { key: "width", label: "Width", type: "number", unit: "in", group: "Dimensions" },
      { key: "height", label: "Height", type: "number", unit: "in", group: "Dimensions" },
      { key: "depth", label: "Depth", type: "number", unit: "in", group: "Dimensions" },
      { key: "species", label: "Species", type: "select", options: ["Walnut", "Oak", "Maple", "Cherry", "Ash", "Pine"], group: "Materials" },
      { key: "finish", label: "Finish", type: "select", options: ["Oil", "Wax", "Lacquer", "Poly", "Stain", "Raw"], group: "Materials" },
      { key: "joint_type", label: "Joinery", type: "select", options: ["Mortise & Tenon", "Dovetail", "Pocket Screw", "Butt", "Dowel", "Biscuit"], group: "Joinery" },
    ],
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
      "INSERT INTO config (id, shop_type, entity_labels, stations, l3_statuses, l3_terminal_status, station_menus) VALUES (1,?,?,?,?,?,?)"
    ).bind(
      "cabinet",
      JSON.stringify(tpl.entity_labels),
      JSON.stringify(tpl.stations),
      JSON.stringify(tpl.l3_statuses),
      tpl.l3_terminal_status,
      JSON.stringify(tpl.station_menus),
    ).run();
    cachedConfig = { shop_type: "cabinet", ...tpl };
  } else {
    const shopType = row.shop_type as string;
    const tpl = SHOP_TEMPLATES[shopType] || SHOP_TEMPLATES.cabinet;
    cachedConfig = {
      shop_type: shopType,
      entity_labels: JSON.parse(row.entity_labels as string),
      stations: JSON.parse(row.stations as string),
      l3_statuses: JSON.parse(row.l3_statuses as string),
      l3_terminal_status: row.l3_terminal_status as string,
      station_menus: JSON.parse((row.station_menus as string) || "[]"),
      part_properties: tpl.part_properties,
    };
  }
  cacheTime = Date.now();
  return cachedConfig!;
}

// --- Auth Helpers ---

const ROLE_LEVELS: Record<UserRole, number> = { user: 0, lead: 1, supervisor: 2, admin: 3 };
const SESSION_TTL_DAYS = 30;

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const PIN_SALT = "fw_fabworks_2026";
async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(PIN_SALT + pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function getSessionUser(db: D1Database, sessionId: string | undefined): Promise<SessionUser | null> {
  if (!sessionId) return null;
  const row = await db.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.home_page FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now') AND u.active = 1`
  ).bind(sessionId).first<SessionUser>();
  return row || null;
}

function hasRole(user: SessionUser | null, minRole: UserRole): boolean {
  if (!user) return false;
  return ROLE_LEVELS[user.role] >= ROLE_LEVELS[minRole];
}

// --- Helpers ---

async function checkBucketCompletion(db: D1Database, cabinetId: number, config: TenantConfig) {
  const cabinet = await db.prepare(
    "SELECT bucket_id FROM cabinets WHERE id = ?"
  ).bind(cabinetId).first<{ bucket_id: number | null }>();

  if (cabinet?.bucket_id) {
    const remaining = await db.prepare(
      "SELECT COUNT(*) as cnt FROM cabinets WHERE bucket_id = ? AND status != ?"
    ).bind(cabinet.bucket_id, config.l3_terminal_status).first<{ cnt: number }>();

    if (remaining?.cnt === 0) {
      await db.prepare("UPDATE buckets SET status = 'complete' WHERE id = ?")
        .bind(cabinet.bucket_id).run();
    }
  }
}

// --- App ---

type Bindings = { DB: D1Database; PHOTOS: R2Bucket };
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

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(f => {
    if (f == null) return "";
    const s = String(f);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }).join(",");
}

function csvResponse(c: any, filename: string, header: string[], rows: (string | number | null | undefined)[][]): Response {
  const lines = [csvRow(header), ...rows.map(r => csvRow(r))];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

app.get("/api/health", (c) => c.json({ status: "ok", service: "fabworks" }));

// --- Auth API ---

app.post("/api/auth/login", async (c) => {
  const { email, pin } = await c.req.json<{ email: string; pin: string }>();
  if (!email || !pin) return c.json({ error: "Email and PIN required" }, 400);

  const pinHash = await hashPin(pin);
  const user = await c.env.DB.prepare(
    "SELECT id, name, email, role, home_page FROM users WHERE email = ? COLLATE NOCASE AND pin = ? AND active = 1"
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

const VALID_HOME_PAGES: HomePage[] = ["scan", "workbench", "fixit", "staging", "dashboard"];

app.put("/api/auth/home", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const { home_page } = await c.req.json<{ home_page: string }>();
  if (!VALID_HOME_PAGES.includes(home_page as HomePage)) {
    return c.json({ error: `Invalid home_page. Must be one of: ${VALID_HOME_PAGES.join(", ")}` }, 400);
  }
  await c.env.DB.prepare("UPDATE users SET home_page = ? WHERE id = ?").bind(home_page, user.id).run();
  return c.json({ ok: true, home_page });
});

// --- User Profile ---

app.get("/api/profile", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const profile = await c.env.DB.prepare(
    "SELECT id, name, email, role, home_page, team, current_station, avatar_key, created_at FROM users WHERE id = ?"
  ).bind(user.id).first();
  return c.json(profile);
});

app.put("/api/profile", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const body = await c.req.json<{ name?: string; email?: string; pin?: string; team?: string; current_station?: string }>();
  const sets: string[] = [];
  const vals: any[] = [];
  if (body.name) { sets.push("name = ?"); vals.push(body.name.trim()); }
  if (body.email) { sets.push("email = ?"); vals.push(body.email.trim()); }
  if (body.pin) {
    if (body.pin.length < 4) return c.json({ error: "PIN must be at least 4 characters" }, 400);
    sets.push("pin = ?"); vals.push(await hashPin(body.pin));
  }
  if (body.team !== undefined) { sets.push("team = ?"); vals.push(body.team || null); }
  if (body.current_station !== undefined) { sets.push("current_station = ?"); vals.push(body.current_station || null); }
  if (sets.length === 0) return c.json({ error: "Nothing to update" }, 400);
  vals.push(user.id);
  await c.env.DB.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  const updated = await c.env.DB.prepare(
    "SELECT id, name, email, role, home_page, team, current_station, avatar_key, created_at FROM users WHERE id = ?"
  ).bind(user.id).first();
  return c.json(updated);
});

// --- User Management (admin only) ---

app.get("/api/users", requireAuth("admin"), async (c) => {
  const result = await c.env.DB.prepare("SELECT id, name, email, role, home_page, active, created_at FROM users ORDER BY name").all();
  return c.json(result.results);
});

app.post("/api/users", requireAuth("admin"), async (c) => {
  const { name, email, pin, role, home_page } = await c.req.json<{ name: string; email: string; pin: string; role?: UserRole; home_page?: HomePage }>();
  if (!name || !email || !pin) return c.json({ error: "name, email, and pin required" }, 400);
  if (pin.length < 4) return c.json({ error: "PIN must be at least 4 characters" }, 400);
  if (home_page && !VALID_HOME_PAGES.includes(home_page)) return c.json({ error: "Invalid home_page" }, 400);

  const pinHash = await hashPin(pin);
  const result = await c.env.DB.prepare(
    "INSERT INTO users (name, email, pin, role, home_page) VALUES (?, ?, ?, ?, ?) RETURNING id, name, email, role, home_page, active, created_at"
  ).bind(name.trim(), email.trim(), pinHash, role || "user", home_page || "scan").first();
  return c.json(result, 201);
});

app.put("/api/users/:id", requireAuth("admin"), async (c) => {
  const userId = c.req.param("id");
  const body = await c.req.json<{ name?: string; email?: string; pin?: string; role?: UserRole; active?: boolean; home_page?: HomePage }>();

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
  if (body.home_page) {
    if (!VALID_HOME_PAGES.includes(body.home_page)) return c.json({ error: "Invalid home_page" }, 400);
    updates.push("home_page = ?"); binds.push(body.home_page);
  }

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
    station_menus: body.station_menus || current.station_menus,
  };

  await c.env.DB.prepare(
    "UPDATE config SET shop_type=?, entity_labels=?, stations=?, l3_statuses=?, l3_terminal_status=?, station_menus=?, updated_at=datetime('now') WHERE id=1"
  ).bind(
    updated.shop_type,
    JSON.stringify(updated.entity_labels),
    JSON.stringify(updated.stations),
    JSON.stringify(updated.l3_statuses),
    updated.l3_terminal_status,
    JSON.stringify(updated.station_menus),
  ).run();

  cachedConfig = null;
  return c.json(updated);
});

app.post("/api/config/reset", requireAuth("admin"), async (c) => {
  const { shop_type } = await c.req.json<{ shop_type: string }>();
  const tpl = SHOP_TEMPLATES[shop_type];
  if (!tpl) return c.json({ error: `Unknown shop type: ${shop_type}. Available: ${Object.keys(SHOP_TEMPLATES).join(", ")}` }, 400);

  await c.env.DB.prepare(
    "INSERT OR REPLACE INTO config (id, shop_type, entity_labels, stations, l3_statuses, l3_terminal_status, station_menus, updated_at) VALUES (1,?,?,?,?,?,?,datetime('now'))"
  ).bind(
    shop_type,
    JSON.stringify(tpl.entity_labels),
    JSON.stringify(tpl.stations),
    JSON.stringify(tpl.l3_statuses),
    tpl.l3_terminal_status,
    JSON.stringify(tpl.station_menus),
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

// --- CSV Import ---

app.post("/api/jobs/:jobId/import", requireAuth("lead"), async (c) => {
  const jobId = parseInt(c.req.param("jobId"));
  const config = c.get("config");
  const propDefs = config.part_properties || [];

  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file || typeof file === "string") return c.json({ error: "No CSV file provided" }, 400);

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l: string) => l.trim());
  if (lines.length < 2) return c.json({ error: "CSV must have a header row and at least one data row" }, 400);

  const headers = lines[0].split(",").map((h: string) => h.trim().replace(/^"|"$/g, ""));
  const numCol = headers.findIndex((h: string) => /^(cabinet.?number|number|#|part.?num)/i.test(h));
  if (numCol === -1) return c.json({ error: "CSV must have a cabinet_number column (or 'Number', '#', 'Part Num')" }, 400);

  const labelCol = headers.findIndex((h: string) => /^(label|name|description)/i.test(h));
  const bucketCol = headers.findIndex((h: string) => /^(bucket|group|room)/i.test(h));

  const propMap: { colIdx: number; key: string }[] = [];
  const unmapped: string[] = [];
  headers.forEach((h: string, idx: number) => {
    if (idx === numCol || idx === labelCol || idx === bucketCol) return;
    const def = propDefs.find((d) => d.key.toLowerCase() === h.toLowerCase() || d.label.toLowerCase() === h.toLowerCase());
    if (def) propMap.push({ colIdx: idx, key: def.key });
    else unmapped.push(h);
  });

  let imported = 0, created = 0, updated = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    const cabNum = parseInt(cols[numCol]);
    if (isNaN(cabNum)) { errors.push(`Row ${i + 1}: invalid cabinet number "${cols[numCol]}"`); continue; }

    let cab = await c.env.DB.prepare(
      "SELECT id, properties FROM cabinets WHERE job_id = ? AND cabinet_number = ?"
    ).bind(jobId, cabNum).first<{ id: number; properties: string }>();

    if (!cab) {
      const label = labelCol >= 0 ? cols[labelCol] || null : null;
      let bucketId: number | null = null;
      if (bucketCol >= 0 && cols[bucketCol]) {
        const b = await c.env.DB.prepare(
          "SELECT id FROM buckets WHERE job_id = ? AND name = ?"
        ).bind(jobId, cols[bucketCol]).first<{ id: number }>();
        if (b) bucketId = b.id;
      }
      const newCab = await c.env.DB.prepare(
        "INSERT INTO cabinets (job_id, bucket_id, cabinet_number, label) VALUES (?, ?, ?, ?) RETURNING id"
      ).bind(jobId, bucketId, cabNum, label).first<{ id: number }>();
      if (!newCab) { errors.push(`Row ${i + 1}: failed to create cabinet #${cabNum}`); continue; }
      cab = { id: newCab.id, properties: "{}" };
      created++;
    } else {
      updated++;
    }

    const existing = JSON.parse(cab.properties || "{}");
    for (const pm of propMap) {
      const val = cols[pm.colIdx];
      if (val !== undefined && val !== "") {
        const def = propDefs.find((d) => d.key === pm.key);
        existing[pm.key] = def?.type === "number" ? parseFloat(val) || val : val;
      }
    }

    if (labelCol >= 0 && cols[labelCol]) {
      await c.env.DB.prepare("UPDATE cabinets SET label = ? WHERE id = ?").bind(cols[labelCol], cab.id).run();
    }

    await c.env.DB.prepare("UPDATE cabinets SET properties = ? WHERE id = ?").bind(JSON.stringify(existing), cab.id).run();
    imported++;
  }

  await c.env.DB.prepare("UPDATE jobs SET cabinet_count = (SELECT COUNT(*) FROM cabinets WHERE job_id = ?) WHERE id = ?").bind(jobId, jobId).run();

  return c.json({ imported, created, updated, errors, unmapped });
});

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

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

  // Idempotency: skip duplicate scans from offline queue replay
  const requestId = c.req.header("X-Request-Id");
  if (requestId && c.req.header("X-Offline-Queued")) {
    const dupe = await c.env.DB.prepare(
      "SELECT id FROM scans WHERE station = ? AND job_id = ? AND cabinet_id IS ? AND scanned_at > datetime('now', '-5 minutes') ORDER BY scanned_at DESC LIMIT 1"
    ).bind(body.station, jobId, body.cabinet_id || null).first<{ id: number }>();
    if (dupe) return c.json({ scan_id: dupe.id, deduplicated: true }, 200);
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

    if (stationDef.sets_status === config.l3_terminal_status) {
      await checkBucketCompletion(c.env.DB, body.cabinet_id, config);
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
    body.scanned_by || c.get("user")?.name || null,
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

// --- Daily Briefs ---

app.get("/api/briefs/today", requireAuth(), async (c) => {
  const today = new Date().toISOString().slice(0, 10);
  const brief = await c.env.DB.prepare(
    "SELECT db.*, u.name as author_name FROM daily_briefs db JOIN users u ON db.created_by = u.id WHERE db.brief_date = ?"
  ).bind(today).first();
  return c.json(brief || { brief_date: today, content: "", author_name: null });
});

app.put("/api/briefs/today", requireAuth("lead"), async (c) => {
  const user = c.get("user")!;
  const { content } = await c.req.json<{ content: string }>();
  if (content === undefined) return c.json({ error: "content required" }, 400);
  const today = new Date().toISOString().slice(0, 10);
  const result = await c.env.DB.prepare(
    `INSERT INTO daily_briefs (brief_date, content, created_by) VALUES (?, ?, ?)
     ON CONFLICT(brief_date) DO UPDATE SET content = excluded.content, created_by = excluded.created_by`
  ).bind(today, content, user.id).run();
  return c.json({ ok: true, brief_date: today });
});

// --- Job Detail Updates ---

app.put("/api/jobs/:id", requireAuth("lead"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    finish_details?: string;
    engineering_notes?: string;
    external_links?: string;
    status?: string;
  }>();
  const sets: string[] = [];
  const vals: any[] = [];
  if (body.finish_details !== undefined) { sets.push("finish_details = ?"); vals.push(body.finish_details); }
  if (body.engineering_notes !== undefined) { sets.push("engineering_notes = ?"); vals.push(body.engineering_notes); }
  if (body.external_links !== undefined) { sets.push("external_links = ?"); vals.push(body.external_links); }
  if (body.status !== undefined) { sets.push("status = ?"); vals.push(body.status); }
  if (sets.length === 0) return c.json({ error: "No fields to update" }, 400);
  vals.push(id);
  await c.env.DB.prepare(`UPDATE jobs SET ${sets.join(", ")} WHERE id = ?`).bind(...vals).run();
  const job = await c.env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(id).first();
  return c.json(job);
});

// --- Notes ---

app.get("/api/notes", requireAuth(), async (c) => {
  const contextType = c.req.query("context_type");
  const contextId = c.req.query("context_id");
  if (!contextType || !contextId) return c.json({ error: "context_type and context_id required" }, 400);
  const result = await c.env.DB.prepare(
    `SELECT n.*, u.name as author_name FROM notes n
     JOIN users u ON n.created_by = u.id
     WHERE n.context_type = ? AND n.context_id = ?
     ORDER BY n.created_at DESC`
  ).bind(contextType, contextId).all();
  return c.json(result.results);
});

app.post("/api/notes", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const { context_type, context_id, title, content } = await c.req.json<{
    context_type: string;
    context_id: string;
    title?: string;
    content: string;
  }>();
  if (!context_type || !context_id || !content) return c.json({ error: "context_type, context_id, and content required" }, 400);
  const result = await c.env.DB.prepare(
    "INSERT INTO notes (context_type, context_id, title, content, created_by) VALUES (?, ?, ?, ?, ?) RETURNING *"
  ).bind(context_type, context_id, title || null, content, user.id).first();
  return c.json(result, 201);
});

app.put("/api/notes/:id", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const note = await c.env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(id).first() as any;
  if (!note) return c.json({ error: "Note not found" }, 404);
  const isLead = ROLE_LEVELS[user.role] >= ROLE_LEVELS.lead;
  if (note.created_by !== user.id && !isLead) return c.json({ error: "Unauthorized" }, 403);
  const { title, content } = await c.req.json<{ title?: string; content?: string }>();
  await c.env.DB.prepare(
    "UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = datetime('now') WHERE id = ?"
  ).bind(title ?? null, content ?? null, id).run();
  const updated = await c.env.DB.prepare("SELECT n.*, u.name as author_name FROM notes n JOIN users u ON n.created_by = u.id WHERE n.id = ?").bind(id).first();
  return c.json(updated);
});

app.delete("/api/notes/:id", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const note = await c.env.DB.prepare("SELECT * FROM notes WHERE id = ?").bind(id).first() as any;
  if (!note) return c.json({ error: "Note not found" }, 404);
  const isLead = ROLE_LEVELS[user.role] >= ROLE_LEVELS.lead;
  if (note.created_by !== user.id && !isLead) return c.json({ error: "Unauthorized" }, 403);
  await c.env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
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

  const timerData = await c.env.DB.prepare(
    `SELECT
       u.name as assembler,
       COUNT(*) as total_started,
       COUNT(bs.completed_at) as total_completed,
       ROUND(AVG(CASE WHEN bs.completed_at IS NOT NULL
         THEN (julianday(bs.completed_at) - julianday(bs.started_at)) * 1440 - bs.total_paused_seconds / 60.0
         END), 1) as avg_working_minutes,
       ROUND(AVG(CASE WHEN bs.completed_at IS NOT NULL
         THEN bs.total_paused_seconds / 60.0
         END), 1) as avg_paused_minutes
     FROM build_sessions bs
     JOIN users u ON bs.user_id = u.id
     WHERE bs.started_at >= datetime('now', '-' || ? || ' days')
     GROUP BY bs.user_id
     ORDER BY total_completed DESC`
  ).bind(days).all();

  const timerByAssembler: Record<string, { avg_working_minutes: number; avg_paused_minutes: number; source: string }> = {};
  for (const row of timerData.results as Array<{ assembler: string; avg_working_minutes: number; avg_paused_minutes: number }>) {
    timerByAssembler[row.assembler] = { avg_working_minutes: row.avg_working_minutes, avg_paused_minutes: row.avg_paused_minutes, source: "timer" };
  }

  const pauseDaily = await c.env.DB.prepare(
    `SELECT
       u.name AS assembler,
       DATE(bs.started_at) AS day,
       ROUND(AVG(bs.total_paused_seconds / 60.0), 1) AS avg_pause_min
     FROM build_sessions bs
     JOIN users u ON bs.user_id = u.id
     WHERE bs.completed_at IS NOT NULL
       AND bs.started_at >= datetime('now', '-' || ? || ' days')
     GROUP BY bs.user_id, DATE(bs.started_at)
     ORDER BY day ASC`
  ).bind(days).all();

  const pauseDailyByAssembler: Record<string, Array<{ day: string; avg_pause_min: number }>> = {};
  for (const row of pauseDaily.results as Array<{ assembler: string; day: string; avg_pause_min: number }>) {
    if (!pauseDailyByAssembler[row.assembler]) pauseDailyByAssembler[row.assembler] = [];
    pauseDailyByAssembler[row.assembler].push({ day: row.day, avg_pause_min: row.avg_pause_min });
  }

  const fixitData = await c.env.DB.prepare(
    `SELECT
       u.name AS assembler,
       COUNT(*) AS total_fixits,
       COUNT(CASE WHEN f.root_cause = 'cnc_error' THEN 1 END) AS cnc_error,
       COUNT(CASE WHEN f.root_cause = 'material_defect' THEN 1 END) AS material_defect,
       COUNT(CASE WHEN f.root_cause = 'transit_damage' THEN 1 END) AS transit_damage,
       COUNT(CASE WHEN f.root_cause = 'other' THEN 1 END) AS other_cause
     FROM fixit_requests f
     JOIN users u ON f.requested_by = u.id
     WHERE f.created_at >= datetime('now', '-' || ? || ' days')
     GROUP BY f.requested_by`
  ).bind(days).all();

  const fixitByAssembler: Record<string, { total_fixits: number; cnc_error: number; material_defect: number; transit_damage: number; other_cause: number }> = {};
  for (const row of fixitData.results as Array<{ assembler: string; total_fixits: number; cnc_error: number; material_defect: number; transit_damage: number; other_cause: number }>) {
    fixitByAssembler[row.assembler] = { total_fixits: row.total_fixits, cnc_error: row.cnc_error, material_defect: row.material_defect, transit_damage: row.transit_damage, other_cause: row.other_cause };
  }

  const assemblers = (result.results as Array<Record<string, unknown>>).map((a) => {
    const timer = timerByAssembler[a.assembler as string];
    const fixit = fixitByAssembler[a.assembler as string];
    const completed = (a.total_completed as number) || 0;
    const fixitCount = fixit?.total_fixits || 0;
    const fixitRate = completed > 0 ? Math.round((fixitCount / completed) * 1000) / 10 : 0;
    return { ...a, ...(timer || { source: "estimated" }), fixit_count: fixitCount, fixit_rate: fixitRate, fixit_breakdown: fixit || null };
  });

  const totalFixits = assemblers.reduce((s, a) => s + ((a as Record<string, unknown>).fixit_count as number), 0);
  const totalCompleted = assemblers.reduce((s, a) => s + ((a as Record<string, unknown>).total_completed as number || 0), 0);
  const teamFixitRate = totalCompleted > 0 ? Math.round((totalFixits / totalCompleted) * 1000) / 10 : 0;

  return c.json({
    assemblers,
    daily: dailyByAssembler,
    pause_daily: pauseDailyByAssembler,
    start_station: config.stations.find((s) => s.slug === startStation)?.name,
    end_station: config.stations.find((s) => s.slug === endStation)?.name,
    days,
    team_fixits: totalFixits,
    team_fixit_rate: teamFixitRate,
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

// --- Reports ---

app.get("/api/reports/jobs", requireAuth("lead"), async (c) => {
  const config = c.get("config");
  const terminalStatus = config.l3_terminal_status;

  const jobs = await c.env.DB.prepare(
    `SELECT j.id, j.job_number, j.job_name, j.status, j.cabinet_count,
       COUNT(c.id) as actual_cabinets,
       COUNT(CASE WHEN c.status = ? THEN 1 END) as completed_count
     FROM jobs j
     LEFT JOIN cabinets c ON c.job_id = j.id
     WHERE j.status != 'cancelled'
     GROUP BY j.id
     ORDER BY CASE j.status WHEN 'active' THEN 0 WHEN 'complete' THEN 1 ELSE 2 END, j.job_number`
  ).bind(terminalStatus).all();

  const statusBreakdown = await c.env.DB.prepare(
    `SELECT j.id as job_id, c.status, COUNT(*) as count
     FROM jobs j
     JOIN cabinets c ON c.job_id = j.id
     WHERE j.status != 'cancelled'
     GROUP BY j.id, c.status`
  ).all();

  const breakdownMap: Record<number, Record<string, number>> = {};
  for (const row of statusBreakdown.results as Array<{ job_id: number; status: string; count: number }>) {
    if (!breakdownMap[row.job_id]) breakdownMap[row.job_id] = {};
    breakdownMap[row.job_id][row.status] = row.count;
  }

  const result = (jobs.results as Array<Record<string, unknown>>).map(j => {
    const total = (j.actual_cabinets as number) || (j.cabinet_count as number) || 0;
    const completed = (j.completed_count as number) || 0;
    const pct = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
    return {
      ...j,
      pct_complete: pct,
      remaining: total - completed,
      status_breakdown: breakdownMap[j.id as number] || {},
    };
  });

  return c.json(result);
});

app.get("/api/reports/jobs/csv", requireAuth("lead"), async (c) => {
  const config = c.get("config");
  const terminalStatus = config.l3_terminal_status;

  const jobs = await c.env.DB.prepare(
    `SELECT j.job_number, j.job_name, j.status, j.cabinet_count,
       COUNT(c.id) as actual_cabinets,
       COUNT(CASE WHEN c.status = ? THEN 1 END) as completed_count
     FROM jobs j
     LEFT JOIN cabinets c ON c.job_id = j.id
     WHERE j.status != 'cancelled'
     GROUP BY j.id
     ORDER BY j.job_number`
  ).bind(terminalStatus).all();

  const rows = (jobs.results as Array<Record<string, unknown>>).map(j => {
    const total = (j.actual_cabinets as number) || (j.cabinet_count as number) || 0;
    const completed = (j.completed_count as number) || 0;
    const pct = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
    return [j.job_number as string, j.job_name as string, j.status as string, total, completed, pct, total - completed];
  });

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(c, `job-completion-${today}.csv`,
    ["Job Number", "Job Name", "Status", "Total Cabinets", "Completed", "% Complete", "Remaining"],
    rows
  );
});

app.get("/api/reports/assemblers/csv", requireAuth("lead"), async (c) => {
  const config = c.get("config");
  const days = parseInt(c.req.query("days") || "30");

  const l3Stations = config.stations.filter((s) => s.level === "l3" && s.sets_status);
  const startStation = l3Stations[0]?.slug;
  const endStation = l3Stations[1]?.slug;
  if (!startStation || !endStation) return csvResponse(c, "assembler-productivity.csv", ["Assembler"], []);

  const result = await c.env.DB.prepare(
    `SELECT
       starts.scanned_by as assembler,
       COUNT(*) as total_started,
       COUNT(completes.id) as total_completed,
       ROUND(AVG(CASE WHEN completes.id IS NOT NULL
         THEN (julianday(completes.scanned_at) - julianday(starts.scanned_at)) * 1440
         END), 1) as avg_minutes,
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

  const fixitData = await c.env.DB.prepare(
    `SELECT u.name AS assembler, COUNT(*) AS total_fixits
     FROM fixit_requests f
     JOIN users u ON f.requested_by = u.id
     WHERE f.created_at >= datetime('now', '-' || ? || ' days')
     GROUP BY f.requested_by`
  ).bind(days).all();

  const fixitMap: Record<string, number> = {};
  for (const row of fixitData.results as Array<{ assembler: string; total_fixits: number }>) {
    fixitMap[row.assembler] = row.total_fixits;
  }

  const rows = (result.results as Array<Record<string, unknown>>).map(a => {
    const completed = (a.total_completed as number) || 0;
    const fixits = fixitMap[a.assembler as string] || 0;
    const rate = completed > 0 ? Math.round((fixits / completed) * 1000) / 10 : 0;
    return [a.assembler as string, completed, a.per_day as number, a.avg_minutes as number, fixits, rate];
  });

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(c, `assembler-productivity-${days}d-${today}.csv`,
    ["Assembler", "Completed", "Per Day", "Avg Cycle (min)", "FixIt Count", "Defect Rate %"],
    rows
  );
});

app.get("/api/reports/quality", requireAuth("lead"), async (c) => {
  const days = parseInt(c.req.query("days") || "30");

  const causeCounts = await c.env.DB.prepare(
    `SELECT root_cause, COUNT(*) as count
     FROM fixit_requests
     WHERE created_at >= datetime('now', '-' || ? || ' days')
     GROUP BY root_cause`
  ).bind(days).all();

  const resolution = await c.env.DB.prepare(
    `SELECT ROUND(AVG(
       (julianday(resolved_at) - julianday(created_at)) * 1440
     ), 1) as avg_resolution_minutes,
     COUNT(*) as resolved_count
     FROM fixit_requests
     WHERE status = 'resolved'
       AND created_at >= datetime('now', '-' || ? || ' days')`
  ).bind(days).first<{ avg_resolution_minutes: number | null; resolved_count: number }>();

  const topCabinets = await c.env.DB.prepare(
    `SELECT cab.cabinet_number, cab.label, j.job_number, COUNT(*) as issue_count
     FROM fixit_requests f
     JOIN cabinets cab ON f.cabinet_id = cab.id
     JOIN jobs j ON f.job_id = j.id
     WHERE f.created_at >= datetime('now', '-' || ? || ' days')
     GROUP BY f.cabinet_id
     ORDER BY issue_count DESC
     LIMIT 10`
  ).bind(days).all();

  const totalFixits = (causeCounts.results as Array<{ count: number }>).reduce((s, r) => s + r.count, 0);
  const causes = (causeCounts.results as Array<{ root_cause: string; count: number }>).map(r => ({
    ...r,
    pct: totalFixits > 0 ? Math.round((r.count / totalFixits) * 1000) / 10 : 0,
  }));

  return c.json({
    causes,
    total_fixits: totalFixits,
    avg_resolution_minutes: resolution?.avg_resolution_minutes ?? null,
    resolved_count: resolution?.resolved_count ?? 0,
    top_cabinets: topCabinets.results,
    days,
  });
});

app.get("/api/reports/quality/csv", requireAuth("lead"), async (c) => {
  const days = parseInt(c.req.query("days") || "30");

  const fixits = await c.env.DB.prepare(
    `SELECT f.id, cab.cabinet_number, cab.label, j.job_number, f.root_cause,
       f.description, f.status, f.created_at, f.resolved_at,
       u_req.name as requested_by_name, u_res.name as resolved_by_name,
       CASE WHEN f.resolved_at IS NOT NULL
         THEN ROUND((julianday(f.resolved_at) - julianday(f.created_at)) * 1440, 1)
         ELSE NULL END as resolution_minutes
     FROM fixit_requests f
     JOIN cabinets cab ON f.cabinet_id = cab.id
     JOIN jobs j ON f.job_id = j.id
     LEFT JOIN users u_req ON f.requested_by = u_req.id
     LEFT JOIN users u_res ON f.resolved_by = u_res.id
     WHERE f.created_at >= datetime('now', '-' || ? || ' days')
     ORDER BY f.created_at DESC`
  ).bind(days).all();

  const rows = (fixits.results as Array<Record<string, unknown>>).map(f => [
    f.job_number as string,
    f.cabinet_number as string,
    f.label as string,
    f.root_cause as string,
    f.description as string,
    f.status as string,
    f.requested_by_name as string,
    f.resolved_by_name as string,
    f.created_at as string,
    f.resolved_at as string,
    f.resolution_minutes as number,
  ]);

  const today = new Date().toISOString().slice(0, 10);
  return csvResponse(c, `quality-report-${days}d-${today}.csv`,
    ["Job", "Cabinet #", "Label", "Root Cause", "Description", "Status", "Requested By", "Resolved By", "Created", "Resolved", "Resolution (min)"],
    rows
  );
});

app.get("/api/reports/weekly-summary", requireAuth("lead"), async (c) => {
  const config = c.get("config");
  const terminalStatus = config.l3_terminal_status;

  const l3Stations = config.stations.filter((s) => s.level === "l3" && s.sets_status);
  const endStation = l3Stations[1]?.slug;

  const cabinetsBuilt = endStation ? await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM scans
     WHERE station = ? AND scanned_at >= datetime('now', '-7 days')`
  ).bind(endStation).first<{ count: number }>() : { count: 0 };

  const avgBuild = await c.env.DB.prepare(
    `SELECT ROUND(AVG(
       (julianday(bs.completed_at) - julianday(bs.started_at)) * 1440 - bs.total_paused_seconds / 60.0
     ), 1) as avg_minutes,
     COUNT(*) as count
     FROM build_sessions bs
     WHERE bs.completed_at IS NOT NULL
       AND bs.started_at >= datetime('now', '-7 days')`
  ).first<{ avg_minutes: number | null; count: number }>();

  const fixitCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM fixit_requests
     WHERE created_at >= datetime('now', '-7 days')`
  ).first<{ count: number }>();

  const jobsCompleted = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT j.id) as count
     FROM jobs j
     JOIN cabinets c ON c.job_id = j.id
     WHERE j.status = 'complete'
       AND EXISTS (
         SELECT 1 FROM scans s WHERE s.job_id = j.id
         AND s.scanned_at >= datetime('now', '-7 days')
       )`
  ).first<{ count: number }>();

  return c.json({
    jobs_completed: jobsCompleted?.count ?? 0,
    cabinets_built: cabinetsBuilt?.count ?? 0,
    avg_build_minutes: avgBuild?.avg_minutes ?? null,
    builds_count: avgBuild?.count ?? 0,
    fixit_count: fixitCount?.count ?? 0,
  });
});

// --- Station view ---

app.get("/api/stations/:slug/items", async (c) => {
  const config = c.get("config");
  const slug = c.req.param("slug");
  const date = c.req.query("date") || null;
  const stationDef = config.stations.find((s) => s.slug === slug);
  if (!stationDef) return c.json({ error: `Unknown station: ${slug}` }, 400);

  const laterStations = config.stations
    .filter((s) => s.level === stationDef.level && s.seq > stationDef.seq)
    .map((s) => s.slug);

  const laterPlaceholders = laterStations.map(() => "?").join(",");
  const dateFilter = date ? " AND DATE(s.scanned_at) = ?" : "";
  const dateBinds = date ? [date] : [];

  if (stationDef.level === "l1") {
    const query = (laterStations.length > 0 && !date)
      ? `SELECT DISTINCT j.id, j.job_number, j.job_name, j.cabinet_count, s.scanned_at
         FROM jobs j
         JOIN scans s ON s.job_id = j.id AND s.station = ?
         WHERE j.status = 'active'${dateFilter}
         AND NOT EXISTS (SELECT 1 FROM scans s2 WHERE s2.job_id = j.id AND s2.station IN (${laterPlaceholders}))
         ORDER BY s.scanned_at DESC`
      : `SELECT DISTINCT j.id, j.job_number, j.job_name, j.cabinet_count, s.scanned_at
         FROM jobs j
         JOIN scans s ON s.job_id = j.id AND s.station = ?
         WHERE j.status = 'active'${dateFilter}
         ORDER BY s.scanned_at DESC`;
    const binds = (laterStations.length > 0 && !date) ? [slug, ...dateBinds, ...laterStations] : [slug, ...dateBinds];
    const result = await c.env.DB.prepare(query).bind(...binds).all();
    return c.json({ level: "l1", items: result.results });
  }

  if (stationDef.level === "l2") {
    const query = (laterStations.length > 0 && !date)
      ? `SELECT DISTINCT b.id, b.name, b.cabinet_count, b.status, j.id as job_id, j.job_number, j.job_name, s.scanned_at
         FROM buckets b
         JOIN jobs j ON b.job_id = j.id
         JOIN scans s ON s.bucket_id = b.id AND s.station = ?
         WHERE j.status = 'active'${dateFilter}
         AND NOT EXISTS (SELECT 1 FROM scans s2 WHERE s2.bucket_id = b.id AND s2.station IN (${laterPlaceholders}))
         ORDER BY s.scanned_at DESC`
      : `SELECT DISTINCT b.id, b.name, b.cabinet_count, b.status, j.id as job_id, j.job_number, j.job_name, s.scanned_at
         FROM buckets b
         JOIN jobs j ON b.job_id = j.id
         JOIN scans s ON s.bucket_id = b.id AND s.station = ?
         WHERE j.status = 'active'${dateFilter}
         ORDER BY s.scanned_at DESC`;
    const binds = (laterStations.length > 0 && !date) ? [slug, ...dateBinds, ...laterStations] : [slug, ...dateBinds];
    const result = await c.env.DB.prepare(query).bind(...binds).all();
    return c.json({ level: "l2", items: result.results });
  }

  // l3 level
  const query = (laterStations.length > 0 && !date)
    ? `SELECT DISTINCT cab.id, cab.cabinet_number, cab.label, cab.status, cab.accessories, cab.notes, cab.assembly_sheet_url, b.name as bucket_name, j.id as job_id, j.job_number, j.job_name, s.scanned_at
       FROM cabinets cab
       JOIN jobs j ON cab.job_id = j.id
       LEFT JOIN buckets b ON cab.bucket_id = b.id
       JOIN scans s ON s.cabinet_id = cab.id AND s.station = ?
       WHERE j.status = 'active'${dateFilter}
       AND NOT EXISTS (SELECT 1 FROM scans s2 WHERE s2.cabinet_id = cab.id AND s2.station IN (${laterPlaceholders}))
       ORDER BY s.scanned_at DESC`
    : `SELECT DISTINCT cab.id, cab.cabinet_number, cab.label, cab.status, cab.accessories, cab.notes, cab.assembly_sheet_url, b.name as bucket_name, j.id as job_id, j.job_number, j.job_name, s.scanned_at
       FROM cabinets cab
       JOIN jobs j ON cab.job_id = j.id
       LEFT JOIN buckets b ON cab.bucket_id = b.id
       JOIN scans s ON s.cabinet_id = cab.id AND s.station = ?
       WHERE j.status = 'active'${dateFilter}
       ORDER BY s.scanned_at DESC`;
  const binds = (laterStations.length > 0 && !date) ? [slug, ...dateBinds, ...laterStations] : [slug, ...dateBinds];
  const result = await c.env.DB.prepare(query).bind(...binds).all();
  return c.json({ level: "l3", items: result.results });
});

// --- Cabinet Detail ---

app.get("/api/cabinets/:id", requireAuth(), async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const cabinet = await c.env.DB.prepare(
    `SELECT c.*, b.name as bucket_name, j.job_number, j.job_name
     FROM cabinets c
     LEFT JOIN buckets b ON c.bucket_id = b.id
     LEFT JOIN jobs j ON c.job_id = j.id
     WHERE c.id = ?`
  ).bind(id).first();
  if (!cabinet) return c.json({ error: "Cabinet not found" }, 404);

  const scans = await c.env.DB.prepare(
    "SELECT station, scanned_by, scanned_at FROM scans WHERE cabinet_id = ? ORDER BY scanned_at DESC LIMIT 20"
  ).bind(id).all();

  const builds = await c.env.DB.prepare(
    `SELECT bs.started_at, bs.completed_at, bs.total_paused_seconds, u.name as user_name
     FROM build_sessions bs LEFT JOIN users u ON bs.user_id = u.id
     WHERE bs.cabinet_id = ? ORDER BY bs.started_at DESC`
  ).bind(id).all();

  const fixits = await c.env.DB.prepare(
    `SELECT fr.root_cause, fr.description, fr.status, fr.created_at, fr.photo_key,
            u.name as resolved_by
     FROM fixit_requests fr LEFT JOIN users u ON fr.resolved_by = u.id
     WHERE fr.cabinet_id = ? ORDER BY fr.created_at DESC`
  ).bind(id).all();

  const notes = await c.env.DB.prepare(
    `SELECT n.title, n.content, n.created_at, u.name as author_name
     FROM notes n LEFT JOIN users u ON n.author_id = u.id
     WHERE n.context_type = 'cabinet' AND n.context_id = ? ORDER BY n.created_at DESC`
  ).bind(id).all();

  return c.json({
    cabinet,
    job: { id: cabinet.job_id, job_number: cabinet.job_number, job_name: cabinet.job_name },
    bucket: cabinet.bucket_id ? { id: cabinet.bucket_id, name: cabinet.bucket_name } : null,
    scans: scans.results,
    build_sessions: builds.results,
    fixit_requests: fixits.results,
    notes: notes.results,
  });
});

app.put("/api/cabinets/:id/properties", requireAuth("lead"), async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json<{ properties: Record<string, string | number> }>();
  const existing = await c.env.DB.prepare("SELECT properties FROM cabinets WHERE id = ?").bind(id).first<{ properties: string }>();
  if (!existing) return c.json({ error: "Cabinet not found" }, 404);
  const current = JSON.parse(existing.properties || "{}");
  const merged = { ...current, ...body.properties };
  await c.env.DB.prepare("UPDATE cabinets SET properties = ? WHERE id = ?").bind(JSON.stringify(merged), id).run();
  return c.json({ ok: true, properties: merged });
});

// --- Staging location ---

app.put("/api/cabinets/:id/location", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json<{ location: string }>();
  const location = (body.location || "").trim() || null;
  await c.env.DB.prepare("UPDATE cabinets SET staging_location = ? WHERE id = ?").bind(location, id).run();
  return c.json({ ok: true });
});

// --- Cabinet metadata (accessories, notes, assembly sheet) ---

app.put("/api/cabinets/:id/metadata", requireAuth("lead"), async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json<{ accessories?: string; notes?: string; assembly_sheet_url?: string }>();
  const updates: string[] = [];
  const binds: unknown[] = [];

  if (body.accessories !== undefined) {
    updates.push("accessories = ?");
    binds.push((body.accessories || "").trim() || null);
  }
  if (body.notes !== undefined) {
    updates.push("notes = ?");
    binds.push((body.notes || "").trim() || null);
  }
  if (body.assembly_sheet_url !== undefined) {
    const url = (body.assembly_sheet_url || "").trim();
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      return c.json({ error: "URL must start with http:// or https://" }, 400);
    }
    updates.push("assembly_sheet_url = ?");
    binds.push(url || null);
  }

  if (updates.length === 0) return c.json({ error: "Nothing to update" }, 400);
  binds.push(id);
  await c.env.DB.prepare(`UPDATE cabinets SET ${updates.join(", ")} WHERE id = ?`).bind(...binds).run();
  return c.json({ ok: true });
});

// --- Cabinet flags ---

const VALID_FLAGS = ["hold", "remake", "missing_part", "priority"] as const;
const FLAG_LABELS: Record<string, string> = {
  hold: "On Hold",
  remake: "Needs Remake",
  missing_part: "Missing Part",
  priority: "Priority",
};

app.post("/api/cabinets/:id/flag", requireAuth("lead"), async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const { flag, action } = await c.req.json<{ flag: string; action?: "add" | "remove" }>();
  if (!VALID_FLAGS.includes(flag as typeof VALID_FLAGS[number])) {
    return c.json({ error: "Invalid flag" }, 400);
  }
  const cab = await c.env.DB.prepare("SELECT flags FROM cabinets WHERE id = ?").bind(id).first<{ flags: string }>();
  if (!cab) return c.json({ error: "Cabinet not found" }, 404);

  const flags: string[] = JSON.parse(cab.flags || "[]");
  const op = action || (flags.includes(flag) ? "remove" : "add");
  let updated: string[];
  if (op === "add") {
    updated = flags.includes(flag) ? flags : [...flags, flag];
  } else {
    updated = flags.filter((f) => f !== flag);
  }
  await c.env.DB.prepare("UPDATE cabinets SET flags = ? WHERE id = ?").bind(JSON.stringify(updated), id).run();
  return c.json({ ok: true, flags: updated });
});

app.get("/api/flags", requireAuth(), (c) => {
  return c.json({ flags: VALID_FLAGS, labels: FLAG_LABELS });
});

app.get("/api/stations/:slug/staging", async (c) => {
  const config = c.get("config");
  const slug = c.req.param("slug");
  const stationDef = config.stations.find((s) => s.slug === slug);
  if (!stationDef) return c.json({ error: `Unknown station: ${slug}` }, 400);
  if (stationDef.sets_status !== config.l3_terminal_status) {
    return c.json({ error: "Not the terminal station" }, 400);
  }

  const date = c.req.query("date") || null;
  const dateFilter = date ? " AND DATE(s.scanned_at) = ?" : "";
  const dateFilter2 = date ? " AND DATE(s2.scanned_at) = ?" : "";
  const subBinds = date ? [slug, date] : [slug];
  const existsBinds = date ? [slug, date] : [slug];

  const rows = await c.env.DB.prepare(`
    SELECT j.id as job_id, j.job_number, j.job_name, j.cabinet_count,
           cab.id as cab_id, cab.cabinet_number, cab.label, cab.status, cab.staging_location, cab.accessories, cab.notes, cab.assembly_sheet_url,
           b.name as bucket_name,
           (SELECT MAX(s.scanned_at) FROM scans s WHERE s.cabinet_id = cab.id AND s.station = ?${dateFilter}) as scanned_at
    FROM jobs j
    JOIN cabinets cab ON cab.job_id = j.id
    LEFT JOIN buckets b ON cab.bucket_id = b.id
    WHERE j.status = 'active'
    AND EXISTS (SELECT 1 FROM scans s2 WHERE s2.station = ?${dateFilter2} AND s2.job_id = j.id)
    ORDER BY j.job_number, cab.cabinet_number
  `).bind(...subBinds, ...existsBinds).all();

  const jobMap = new Map<number, { id: number; job_number: string; job_name: string; cabinet_count: number; staged_count: number; cabinets: unknown[] }>();
  for (const r of rows.results as Record<string, unknown>[]) {
    const jid = r.job_id as number;
    if (!jobMap.has(jid)) {
      jobMap.set(jid, {
        id: jid,
        job_number: r.job_number as string,
        job_name: r.job_name as string,
        cabinet_count: 0,
        staged_count: 0,
        cabinets: [],
      });
    }
    const job = jobMap.get(jid)!;
    job.cabinet_count++;
    const isStaged = r.scanned_at != null;
    if (isStaged) job.staged_count++;
    job.cabinets.push({
      id: r.cab_id,
      cabinet_number: r.cabinet_number,
      label: r.label,
      status: r.status,
      staging_location: r.staging_location,
      accessories: r.accessories,
      notes: r.notes,
      assembly_sheet_url: r.assembly_sheet_url,
      bucket_name: r.bucket_name,
      scanned_at: r.scanned_at,
    });
  }

  return c.json({ jobs: Array.from(jobMap.values()) });
});

// --- Search (find cabinets across the shop) ---

app.get("/api/search", requireAuth(), async (c) => {
  const q = (c.req.query("q") || "").trim();
  if (q.length < 2) return c.json({ results: [] });
  const config = c.get("config");

  const rows = await c.env.DB.prepare(`
    SELECT cab.id, cab.cabinet_number, cab.label, cab.status, cab.flags,
           cab.staging_location, cab.accessories, cab.notes,
           j.id as job_id, j.job_number, j.job_name,
           b.name as bucket_name,
           (SELECT s.station FROM scans s WHERE s.cabinet_id = cab.id ORDER BY s.scanned_at DESC LIMIT 1) as last_station,
           (SELECT s.scanned_at FROM scans s WHERE s.cabinet_id = cab.id ORDER BY s.scanned_at DESC LIMIT 1) as last_scan_at
    FROM cabinets cab
    JOIN jobs j ON cab.job_id = j.id
    LEFT JOIN buckets b ON cab.bucket_id = b.id
    WHERE j.status = 'active'
    AND (
      CAST(cab.cabinet_number AS TEXT) LIKE ?
      OR cab.label LIKE ?
      OR j.job_number LIKE ?
      OR j.job_name LIKE ?
    )
    ORDER BY j.job_number, cab.cabinet_number
    LIMIT 50
  `).bind(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`).all();

  return c.json({ results: rows.results });
});

// --- Staging progress (all active jobs) ---

app.get("/api/staging/progress", requireAuth(), async (c) => {
  const config = c.get("config");
  const terminalStation = config.stations.find((s) => s.sets_status === config.l3_terminal_status);
  if (!terminalStation) return c.json({ jobs: [] });

  const rows = await c.env.DB.prepare(`
    SELECT j.id as job_id, j.job_number, j.job_name,
           cab.id as cab_id, cab.cabinet_number, cab.label, cab.status, cab.flags,
           cab.staging_location, cab.accessories, cab.notes, cab.assembly_sheet_url,
           b.name as bucket_name,
           (SELECT MAX(s.scanned_at) FROM scans s WHERE s.cabinet_id = cab.id AND s.station = ?) as staged_at
    FROM jobs j
    JOIN cabinets cab ON cab.job_id = j.id
    LEFT JOIN buckets b ON cab.bucket_id = b.id
    WHERE j.status = 'active'
    ORDER BY j.job_number, cab.cabinet_number
  `).bind(terminalStation.slug).all();

  const jobMap = new Map<number, { id: number; job_number: string; job_name: string; total: number; staged: number; cabinets: unknown[] }>();
  for (const r of rows.results as Record<string, unknown>[]) {
    const jid = r.job_id as number;
    if (!jobMap.has(jid)) {
      jobMap.set(jid, { id: jid, job_number: r.job_number as string, job_name: r.job_name as string, total: 0, staged: 0, cabinets: [] });
    }
    const job = jobMap.get(jid)!;
    job.total++;
    if (r.staged_at) job.staged++;
    job.cabinets.push({
      id: r.cab_id, cabinet_number: r.cabinet_number, label: r.label,
      status: r.status, flags: r.flags, staging_location: r.staging_location,
      accessories: r.accessories, notes: r.notes, assembly_sheet_url: r.assembly_sheet_url,
      bucket_name: r.bucket_name, staged_at: r.staged_at,
    });
  }
  return c.json({ jobs: Array.from(jobMap.values()) });
});

// --- Build Timer ---

app.post("/api/build/start", requireAuth(), async (c) => {
  const config = c.get("config");
  const user = c.get("user")!;
  const { cabinet_id } = await c.req.json<{ cabinet_id: number }>();
  if (!cabinet_id) return c.json({ error: "cabinet_id required" }, 400);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM build_sessions WHERE user_id = ? AND completed_at IS NULL"
  ).bind(user.id).first<{ id: number }>();
  if (existing) return c.json({ error: "You already have an active build session", active_session_id: existing.id }, 409);

  const cabinetBusy = await c.env.DB.prepare(
    "SELECT id, user_id FROM build_sessions WHERE cabinet_id = ? AND completed_at IS NULL"
  ).bind(cabinet_id).first<{ id: number; user_id: number }>();
  if (cabinetBusy) return c.json({ error: "This cabinet is already being built" }, 409);

  const cab = await c.env.DB.prepare(
    "SELECT c.id, c.job_id, c.cabinet_number, c.bucket_id, j.job_number, j.status as job_status FROM cabinets c JOIN jobs j ON c.job_id = j.id WHERE c.id = ?"
  ).bind(cabinet_id).first<{ id: number; job_id: number; cabinet_number: number; bucket_id: number | null; job_number: string; job_status: string }>();
  if (!cab) return c.json({ error: "Cabinet not found" }, 404);
  if (cab.job_status !== "active") return c.json({ error: `Job ${cab.job_number} is ${cab.job_status}` }, 400);

  const assemblyStart = config.stations.find((s) => s.sets_status === "assembling");
  if (!assemblyStart) return c.json({ error: "No assembly start station configured" }, 500);

  const session = await c.env.DB.prepare(
    "INSERT INTO build_sessions (cabinet_id, job_id, user_id) VALUES (?, ?, ?) RETURNING id, started_at"
  ).bind(cabinet_id, cab.job_id, user.id).first<{ id: number; started_at: string }>();

  await c.env.DB.prepare("UPDATE cabinets SET status = ? WHERE id = ?")
    .bind(assemblyStart.sets_status, cabinet_id).run();

  await c.env.DB.prepare(
    "INSERT INTO scans (job_id, bucket_id, cabinet_id, station, scanned_by) VALUES (?, ?, ?, ?, ?)"
  ).bind(cab.job_id, cab.bucket_id || null, cabinet_id, assemblyStart.slug, user.name).run();

  return c.json({ session_id: session!.id, cabinet_id, job_id: cab.job_id, started_at: session!.started_at }, 201);
});

app.get("/api/build/active", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const session = await c.env.DB.prepare(
    `SELECT bs.*, cab.cabinet_number, cab.label, cab.accessories, cab.notes, cab.assembly_sheet_url,
            j.job_number, j.job_name
     FROM build_sessions bs
     JOIN cabinets cab ON bs.cabinet_id = cab.id
     JOIN jobs j ON bs.job_id = j.id
     WHERE bs.user_id = ? AND bs.completed_at IS NULL`
  ).bind(user.id).first();
  return c.json({ session: session || null });
});

app.get("/api/build/:id", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const id = parseInt(c.req.param("id"), 10);
  const session = await c.env.DB.prepare(
    `SELECT bs.*, cab.cabinet_number, cab.label, cab.accessories, cab.notes, cab.assembly_sheet_url,
            j.job_number, j.job_name
     FROM build_sessions bs
     JOIN cabinets cab ON bs.cabinet_id = cab.id
     JOIN jobs j ON bs.job_id = j.id
     WHERE bs.id = ? AND bs.user_id = ?`
  ).bind(id, user.id).first();
  if (!session) return c.json({ error: "Session not found" }, 404);
  return c.json({ session });
});

app.post("/api/build/:id/pause", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => ({})) as { client_timestamp?: string };
  const session = await c.env.DB.prepare(
    "SELECT id, paused_at, completed_at, user_id FROM build_sessions WHERE id = ?"
  ).bind(id).first<{ id: number; paused_at: string | null; completed_at: string | null; user_id: number }>();
  if (!session || session.user_id !== user.id) return c.json({ error: "Session not found" }, 404);
  if (session.completed_at) return c.json({ error: "Session already completed" }, 400);
  if (session.paused_at) return c.json({ error: "Already paused" }, 400);

  const useClientTs = c.req.header("X-Offline-Queued") && body.client_timestamp && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(body.client_timestamp);
  if (useClientTs) {
    await c.env.DB.prepare("UPDATE build_sessions SET paused_at = ? WHERE id = ?").bind(body.client_timestamp, id).run();
  } else {
    await c.env.DB.prepare("UPDATE build_sessions SET paused_at = datetime('now') WHERE id = ?").bind(id).run();
  }
  return c.json({ ok: true });
});

app.post("/api/build/:id/resume", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => ({})) as { client_timestamp?: string };
  const session = await c.env.DB.prepare(
    "SELECT id, paused_at, completed_at, user_id, total_paused_seconds FROM build_sessions WHERE id = ?"
  ).bind(id).first<{ id: number; paused_at: string | null; completed_at: string | null; user_id: number; total_paused_seconds: number }>();
  if (!session || session.user_id !== user.id) return c.json({ error: "Session not found" }, 404);
  if (session.completed_at) return c.json({ error: "Session already completed" }, 400);
  if (!session.paused_at) return c.json({ error: "Not paused" }, 400);

  const useClientTs = c.req.header("X-Offline-Queued") && body.client_timestamp && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(body.client_timestamp);
  const resumeTime = useClientTs ? new Date(body.client_timestamp!).getTime() : Date.now();
  const pausedAt = new Date(session.paused_at + "Z").getTime();
  const pauseSecs = Math.max(0, Math.round((resumeTime - pausedAt) / 1000));

  const newTotal = session.total_paused_seconds + pauseSecs;
  await c.env.DB.prepare(
    "UPDATE build_sessions SET paused_at = NULL, total_paused_seconds = ? WHERE id = ?"
  ).bind(newTotal, id).run();

  return c.json({ ok: true, total_paused_seconds: newTotal });
});

app.post("/api/build/:id/complete", requireAuth(), async (c) => {
  const config = c.get("config");
  const user = c.get("user")!;
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => ({})) as { client_timestamp?: string };
  const session = await c.env.DB.prepare(
    "SELECT id, cabinet_id, job_id, paused_at, completed_at, user_id, total_paused_seconds, started_at FROM build_sessions WHERE id = ?"
  ).bind(id).first<{ id: number; cabinet_id: number; job_id: number; paused_at: string | null; completed_at: string | null; user_id: number; total_paused_seconds: number; started_at: string }>();
  if (!session || session.user_id !== user.id) return c.json({ error: "Session not found" }, 404);
  if (session.completed_at) return c.json({ ok: true, already_completed: true }, 200);

  const useClientTs = c.req.header("X-Offline-Queued") && body.client_timestamp && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(body.client_timestamp);
  const completeTime = useClientTs ? new Date(body.client_timestamp!).getTime() : Date.now();

  let totalPaused = session.total_paused_seconds;
  if (session.paused_at) {
    const pausedAt = new Date(session.paused_at + "Z").getTime();
    totalPaused += Math.max(0, Math.round((completeTime - pausedAt) / 1000));
  }

  const completedIso = new Date(completeTime).toISOString().replace("T", " ").slice(0, 19);
  await c.env.DB.prepare(
    "UPDATE build_sessions SET completed_at = ?, paused_at = NULL, total_paused_seconds = ? WHERE id = ?"
  ).bind(completedIso, totalPaused, id).run();

  const assemblyComplete = config.stations.find((s) => s.sets_status === "assembled");
  if (assemblyComplete) {
    await c.env.DB.prepare("UPDATE cabinets SET status = ? WHERE id = ?")
      .bind(assemblyComplete.sets_status, session.cabinet_id).run();

    const cab = await c.env.DB.prepare("SELECT bucket_id FROM cabinets WHERE id = ?")
      .bind(session.cabinet_id).first<{ bucket_id: number | null }>();

    await c.env.DB.prepare(
      "INSERT INTO scans (job_id, bucket_id, cabinet_id, station, scanned_by) VALUES (?, ?, ?, ?, ?)"
    ).bind(session.job_id, cab?.bucket_id || null, session.cabinet_id, assemblyComplete.slug, user.name).run();

    if (assemblyComplete.sets_status === config.l3_terminal_status) {
      await checkBucketCompletion(c.env.DB, session.cabinet_id, config);
    }
  }

  const completed = await c.env.DB.prepare(
    "SELECT completed_at, ROUND((julianday(completed_at) - julianday(started_at)) * 1440, 1) as total_minutes FROM build_sessions WHERE id = ?"
  ).bind(id).first<{ completed_at: string; total_minutes: number }>();

  return c.json({
    ok: true,
    completed_at: completed!.completed_at,
    total_paused_seconds: totalPaused,
    total_minutes: completed!.total_minutes,
    working_minutes: Math.round((completed!.total_minutes - totalPaused / 60) * 10) / 10,
  });
});

// --- My Workbench (assembler home) ---

app.get("/api/my/workbench", requireAuth(), async (c) => {
  const config = c.get("config");
  const user = c.get("user")!;

  const assemblyStart = config.stations.find((s) => s.sets_status === "assembling");
  const assemblyComplete = config.stations.find((s) => s.sets_status === "assembled");

  const activeSession = await c.env.DB.prepare(
    `SELECT bs.*, cab.cabinet_number, cab.label, cab.accessories, cab.notes, cab.assembly_sheet_url,
            j.job_number, j.job_name
     FROM build_sessions bs
     JOIN cabinets cab ON bs.cabinet_id = cab.id
     JOIN jobs j ON bs.job_id = j.id
     WHERE bs.user_id = ? AND bs.completed_at IS NULL`
  ).bind(user.id).first();

  let available: unknown[] = [];
  if (assemblyStart) {
    const result = await c.env.DB.prepare(
      `SELECT cab.id, cab.cabinet_number, cab.label, cab.accessories, cab.notes, cab.assembly_sheet_url,
              j.id as job_id, j.job_number, j.job_name, b.name as bucket_name,
              s.scanned_at as ready_at
       FROM cabinets cab
       JOIN jobs j ON cab.job_id = j.id
       LEFT JOIN buckets b ON cab.bucket_id = b.id
       JOIN scans s ON s.cabinet_id = cab.id AND s.station = ?
       WHERE j.status = 'active'
         AND cab.status != 'assembling' AND cab.status != 'assembled' AND cab.status != ?
         AND NOT EXISTS (SELECT 1 FROM build_sessions bs2 WHERE bs2.cabinet_id = cab.id AND bs2.completed_at IS NULL)
       ORDER BY s.scanned_at DESC
       LIMIT 20`
    ).bind(
      config.stations.filter((s) => s.level === "l3" && s.seq < (assemblyStart.seq)).pop()?.slug || "to_assembly",
      config.l3_terminal_status,
    ).all();
    available = result.results;
  }

  const recent = await c.env.DB.prepare(
    `SELECT bs.id, bs.started_at, bs.completed_at, bs.total_paused_seconds,
            ROUND((julianday(bs.completed_at) - julianday(bs.started_at)) * 1440 - bs.total_paused_seconds / 60.0, 1) as working_minutes,
            cab.cabinet_number, cab.label, j.job_number, j.job_name
     FROM build_sessions bs
     JOIN cabinets cab ON bs.cabinet_id = cab.id
     JOIN jobs j ON bs.job_id = j.id
     WHERE bs.user_id = ? AND bs.completed_at IS NOT NULL
     ORDER BY bs.completed_at DESC
     LIMIT 10`
  ).bind(user.id).all();

  const todayCompleted = await c.env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM build_sessions WHERE user_id = ? AND completed_at IS NOT NULL AND DATE(completed_at) = DATE('now')"
  ).bind(user.id).first<{ cnt: number }>();

  return c.json({
    active_session: activeSession || null,
    available,
    recent: recent.results,
    today_completed: todayCompleted?.cnt || 0,
    labels: config.entity_labels,
  });
});

// --- FixIt System ---

const ROOT_CAUSES = ["cnc_error", "material_defect", "transit_damage", "other"] as const;
const ROOT_CAUSE_LABELS: Record<string, string> = {
  cnc_error: "CNC Error",
  material_defect: "Material Defect",
  transit_damage: "Transit Damage",
  other: "Other",
};

app.post("/api/fixit", requireAuth(), async (c) => {
  const user = c.get("user")!;
  const contentType = c.req.header("content-type") || "";

  let cabinetId: number;
  let buildSessionId: number | null = null;
  let rootCause: string;
  let description: string | null = null;
  let photoKey: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await c.req.parseBody();
    cabinetId = parseInt(form.cabinet_id as string, 10);
    buildSessionId = form.build_session_id ? parseInt(form.build_session_id as string, 10) : null;
    rootCause = form.root_cause as string;
    description = (form.description as string) || null;

    const photo = form.photo as File | undefined;
    if (photo && photo.size > 0) {
      const ext = photo.name?.split(".").pop() || "jpg";
      photoKey = `fixit/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      try {
        await c.env.PHOTOS.put(photoKey, photo.stream(), {
          httpMetadata: { contentType: photo.type || "image/jpeg" },
        });
      } catch {
        photoKey = null;
      }
    }
  } else {
    const body = await c.req.json<{ cabinet_id: number; build_session_id?: number; root_cause: string; description?: string }>();
    cabinetId = body.cabinet_id;
    buildSessionId = body.build_session_id || null;
    rootCause = body.root_cause;
    description = body.description || null;
  }

  if (!cabinetId || !rootCause) return c.json({ error: "cabinet_id and root_cause required" }, 400);
  if (!ROOT_CAUSES.includes(rootCause as any)) {
    return c.json({ error: `Invalid root_cause. Must be one of: ${ROOT_CAUSES.join(", ")}` }, 400);
  }

  const cab = await c.env.DB.prepare(
    "SELECT id, job_id FROM cabinets WHERE id = ?"
  ).bind(cabinetId).first<{ id: number; job_id: number }>();
  if (!cab) return c.json({ error: "Cabinet not found" }, 404);

  const result = await c.env.DB.prepare(
    `INSERT INTO fixit_requests (cabinet_id, job_id, build_session_id, requested_by, root_cause, description, photo_key)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, created_at`
  ).bind(cab.id, cab.job_id, buildSessionId, user.id, rootCause, description, photoKey).first<{ id: number; created_at: string }>();

  return c.json({ id: result!.id, created_at: result!.created_at, photo_key: photoKey }, 201);
});

app.get("/api/fixit", requireAuth(), async (c) => {
  const status = c.req.query("status") || "open";
  const result = await c.env.DB.prepare(
    `SELECT f.*, u.name as requested_by_name, cab.cabinet_number, cab.label as cabinet_label,
            j.job_number, j.job_name,
            ru.name as resolved_by_name
     FROM fixit_requests f
     JOIN users u ON f.requested_by = u.id
     JOIN cabinets cab ON f.cabinet_id = cab.id
     JOIN jobs j ON f.job_id = j.id
     LEFT JOIN users ru ON f.resolved_by = ru.id
     WHERE f.status = ?
     ORDER BY f.created_at DESC
     LIMIT 100`
  ).bind(status).all();
  return c.json({ requests: result.results, root_cause_labels: ROOT_CAUSE_LABELS });
});

app.get("/api/fixit/:id", requireAuth(), async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const result = await c.env.DB.prepare(
    `SELECT f.*, u.name as requested_by_name, cab.cabinet_number, cab.label as cabinet_label,
            j.job_number, j.job_name,
            ru.name as resolved_by_name
     FROM fixit_requests f
     JOIN users u ON f.requested_by = u.id
     JOIN cabinets cab ON f.cabinet_id = cab.id
     JOIN jobs j ON f.job_id = j.id
     LEFT JOIN users ru ON f.resolved_by = ru.id
     WHERE f.id = ?`
  ).bind(id).first();
  if (!result) return c.json({ error: "FixIt request not found" }, 404);
  return c.json(result);
});

app.post("/api/fixit/:id/resolve", requireAuth("lead"), async (c) => {
  const user = c.get("user")!;
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json<{ resolution_note?: string }>();

  const existing = await c.env.DB.prepare("SELECT id, status FROM fixit_requests WHERE id = ?").bind(id).first<{ id: number; status: string }>();
  if (!existing) return c.json({ error: "FixIt request not found" }, 404);
  if (existing.status === "resolved") return c.json({ error: "Already resolved" }, 400);

  await c.env.DB.prepare(
    "UPDATE fixit_requests SET status = 'resolved', resolved_by = ?, resolved_at = datetime('now'), resolution_note = ? WHERE id = ?"
  ).bind(user.id, body.resolution_note || null, id).run();

  return c.json({ ok: true });
});

app.get("/api/fixit/:id/photo", requireAuth(), async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  const req = await c.env.DB.prepare("SELECT photo_key FROM fixit_requests WHERE id = ?").bind(id).first<{ photo_key: string | null }>();
  if (!req?.photo_key) return c.json({ error: "No photo" }, 404);

  try {
    const obj = await c.env.PHOTOS.get(req.photo_key);
    if (!obj) return c.json({ error: "Photo not found in storage" }, 404);

    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return c.json({ error: "Photo storage unavailable" }, 503);
  }
});

// --- PWA ---

const PWA_MANIFEST = JSON.stringify({
  name: "FabWorks",
  short_name: "FabWorks",
  description: "Shop Floor Tracker",
  start_url: "/",
  display: "standalone",
  background_color: "#0f172a",
  theme_color: "#0f172a",
  icons: [
    { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
  ],
});

const PWA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1e293b"/>
  <rect x="24" y="24" width="464" height="464" rx="80" fill="#0f172a" stroke="#334155" stroke-width="4"/>
  <text x="256" y="290" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="200" font-weight="800" fill="#3b82f6">FW</text>
  <rect x="120" y="340" width="272" height="6" rx="3" fill="#334155"/>
  <rect x="120" y="340" width="180" height="6" rx="3" fill="#3b82f6"/>
</svg>`;

app.get("/manifest.json", (c) => {
  return c.body(PWA_MANIFEST, 200, { "Content-Type": "application/manifest+json" });
});

app.get("/icon-192.svg", (c) => c.body(PWA_ICON, 200, { "Content-Type": "image/svg+xml" }));
app.get("/icon-512.svg", (c) => c.body(PWA_ICON, 200, { "Content-Type": "image/svg+xml" }));
app.get("/sw.js", (c) => c.body(SERVICE_WORKER_JS, 200, { "Content-Type": "application/javascript", "Cache-Control": "no-cache", "Service-Worker-Allowed": "/" }));

// --- Pages ---

app.get("/login", (c) => {
  if (c.get("user")) return c.redirect("/");
  return c.html(loginPage());
});
app.get("/", requireAuth(), (c) => {
  const user = c.get("user")!;
  const config = c.get("config");
  switch (user.home_page) {
    case "workbench": return c.html(myWorkbenchPage(config, user));
    case "fixit": return c.redirect("/fixit");
    case "staging": return c.redirect("/staging");
    case "dashboard": return c.redirect("/dashboard");
    default: return c.html(scanPage(config, user));
  }
});
app.get("/scan", requireAuth(), (c) => c.html(scanPage(c.get("config"), c.get("user")!)));
app.get("/jobs/new", requireAuth("admin"), (c) => c.html(newJobPage(c.get("config"), c.get("user")!)));
app.get("/dashboard", requireAuth(), (c) => c.html(dashboardPage(c.get("config"), c.get("user")!)));
app.get("/job/:id", requireAuth(), (c) => c.html(jobDetailPage(c.get("config"), c.get("user")!)));
app.get("/stations", requireAuth(), (c) => c.html(stationViewPage(c.get("config"), c.get("user")!)));
app.get("/job/:id/progress", requireAuth(), (c) => c.html(progressPage(c.get("config"), c.get("user")!)));
app.get("/qr", requireAuth("lead"), (c) => c.html(qrPage(c.get("config"), c.get("user")!)));
app.get("/kpi", requireAuth("lead"), (c) => c.html(kpiPage(c.get("config"), c.get("user")!)));
app.get("/takt", requireAuth("lead"), (c) => c.html(taktPage(c.get("config"), c.get("user")!)));
app.get("/reports", requireAuth("lead"), (c) => c.html(reportsPage(c.get("config"), c.get("user")!)));
app.get("/admin", requireAuth("admin"), (c) => c.html(adminPage(c.get("config"), c.get("user")!)));
app.get("/workbench", requireAuth(), (c) => c.html(workbenchPage(c.get("config"), c.get("user")!)));
app.get("/fixit", requireAuth(), (c) => c.html(fixitPage(c.get("config"), c.get("user")!)));
app.get("/staging", requireAuth(), (c) => c.html(stagingPage(c.get("config"), c.get("user")!)));
app.get("/profile", requireAuth(), (c) => c.html(profilePage(c.get("config"), c.get("user")!)));
app.get("/cabinet/:id", requireAuth(), (c) => c.html(cabinetDetailPage(c.get("config"), c.get("user")!)));

app.get("/menu/:slug", requireAuth(), (c) => {
  const config = c.get("config");
  const user = c.get("user")!;
  const slug = c.req.param("slug");
  const menu = config.station_menus.find((m: { slug: string }) => m.slug === slug);
  if (!menu) return c.text("Station menu not found", 404);
  const userLevel = { user: 0, lead: 1, supervisor: 2, admin: 3 }[user.role] || 0;
  const minLevel = { user: 0, lead: 1, supervisor: 2, admin: 3 }[menu.minRole] || 0;
  if (userLevel < minLevel) return c.text("Unauthorized", 403);
  return c.html(stationMenuPage(config, user, menu));
});

export default app;
