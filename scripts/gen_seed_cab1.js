// Generates schema/seed_cab1.sql — realistic HighCraft assembly-floor demo data.
// 5-person team targeting ~200 cabinets/day (≈40 each, ≈4.5-5 cab/hr active).
// Individual pace (3.6-5.4 cab/hr): 2 high, 2 solid, 1 underperformer. Build
// durations derive from each person's pace (~11-17 min/cabinet). Jobs vary in
// size (12-70) with several complete, one in-progress, one pending. Low defect
// rate (~3%). Idempotent: wipes demo rows, reinserts with explicit ids.
const crypto = require("crypto");
const SALT = "fw_fabworks_2026";
const pinHash = (p) => crypto.createHash("sha256").update(SALT + p).digest("hex");

let _s = 20260622;
const rnd = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const rf = (a, b) => a + rnd() * (b - a);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const esc = (s) => String(s).replace(/'/g, "''");
const out = [];
const w = (s) => out.push(s);

// ── Users: 5 assemblers (with pace cab/hr) + water spider + lead + sup + admin
const users = [
  { id: 1,  name: "Brad",   email: "brad@highcraft.demo",   pin: "1234", role: "admin" },
  { id: 2,  name: "Sam",    email: "sam@highcraft.demo",    pin: "3333", role: "supervisor" },
  { id: 3,  name: "Carlos", email: "carlos@highcraft.demo", pin: "4444", role: "lead" },
  { id: 4,  name: "Marcus", email: "marcus@highcraft.demo", pin: "1414", role: "user", pace: 5.4 }, // high
  { id: 5,  name: "Mateo",  email: "mateo@highcraft.demo",  pin: "1111", role: "user", pace: 5.0 }, // high
  { id: 6,  name: "Jordan", email: "jordan@highcraft.demo", pin: "2222", role: "user", pace: 4.5 }, // solid
  { id: 7,  name: "Diego",  email: "diego@highcraft.demo",  pin: "1212", role: "user", pace: 4.1 }, // solid
  { id: 8,  name: "Luis",   email: "luis@highcraft.demo",   pin: "1515", role: "user", pace: 3.6 }, // under
  { id: 9,  name: "Hector", email: "hector@highcraft.demo", pin: "1717", role: "user" },            // water spider
];
const team = users.filter((u) => u.pace);
const paceOf = (id) => users.find((u) => u.id === id).pace;
const userById = (id) => users.find((u) => u.id === id);

// deterministic pace-weighted round-robin: faster assemblers complete more
const _acc = {}; team.forEach((u) => { _acc[u.id] = 0; });
const _paceSum = team.reduce((a, u) => a + u.pace, 0);
function pickAssembler() {
  team.forEach((u) => { _acc[u.id] += u.pace; });
  let best = team[0].id, bestv = -Infinity;
  for (const u of team) if (_acc[u.id] > bestv) { bestv = _acc[u.id]; best = u.id; }
  _acc[best] -= _paceSum;
  return best;
}
const buildMinutes = (uid) => Math.max(8, Math.round((60 / paceOf(uid)) + rf(-1.2, 1.8)));
const pausedMinutes = (uid) => {
  const base = paceOf(uid) >= 5.0 ? ri(0, 3) : paceOf(uid) >= 4.2 ? ri(0, 5) : ri(2, 8);
  return rnd() < 0.45 ? base : 0;
};

const labels = [
  'Base 36" Sink','Base 24" 3-Drawer','Base 18" Door','Base 30" Door','Base 15" Drawer','Base 33" Corner','Base 12" Filler','Base 42" Lazy Susan',
  'Wall 30x36 Double','Wall 24x36 Single','Wall 30x18 Over-Range','Wall 12x36 Single','Wall 36x15 Bridge','Wall 24x30 Single','Wall 18x42 Single','Wall 33x36 Double',
  'Tall 24x84 Pantry','Tall 18x84 Broom','Tall 30x90 Oven','Tall 24x96 Pantry',
  'Vanity 48" Double','Vanity 30" Single','Vanity 36" Single','Vanity 60" Double',
];
let li = 0;
const nextLabel = () => labels[(li++) % labels.length];

// ── Jobs: varied sizes; several finished, one in-progress, one pending ──
// plan: done(today/prior split auto) / active / ready(pending w/ to_assembly) / staged
const jobs = [
  { id: 1, number: "6789", name: "Somewhere House",          size: 70, staged: true,  done: 70, active: 0, ready: 0 },  // big, finished & staged
  { id: 2, number: "7012", name: "Lakeside Remodel",         size: 48, staged: false, done: 48, active: 0, ready: 0 },  // finished today
  { id: 3, number: "7088", name: "Hillside Kitchen",         size: 40, staged: false, done: 40, active: 0, ready: 0 },  // finished today
  { id: 4, number: "7102", name: "Birch Built-ins",          size: 24, staged: false, done: 24, active: 0, ready: 0 },  // finished today
  { id: 5, number: "7115", name: "Cedar Vanities",           size: 12, staged: false, done: 12, active: 0, ready: 0 },  // quick job, finished today
  { id: 6, number: "7045", name: "Maple Ave Kitchen",        size: 36, staged: false, done: 16, active: 6, ready: 14 }, // in progress
  { id: 7, number: "7060", name: "Downtown Office Casework", size: 20, staged: false, done: 0,  active: 0, ready: 0 },  // pending/new
];

let bucketId = 0, cabId = 0, sessId = 0, scanId = 0, pauseId = 0, fixId = 0;
const cabinets = [];
const sessions = [];
const pauseReasons = ["material_wait", "missing_part", "machine", "help_needed", "break", "defect"];

// Minutes since the current UTC midnight, evaluated at apply time. Anchoring
// completions to "start of day + fraction × elapsed" guarantees every completion
// lands within *today* no matter what hour the seed is applied (no midnight
// straddling), so per-day / today counts always read correctly.
const ELAPSED = "(strftime('%H','now')*60 + strftime('%M','now'))";
const atFrac = (f) => `datetime('now','start of day','+' || CAST(${f.toFixed(4)} * ${ELAPSED} AS INT) || ' minutes')`;
// clamp the offset to >= 0 so the modifier is always "+N minutes" (a negative
// value would produce the invalid "+-N minutes" → NULL) and never crosses midnight
const atFracMinus = (f, m) => `datetime('now','start of day','+' || MAX(0, CAST(${f.toFixed(4)} * ${ELAPSED} AS INT) - ${m}) || ' minutes')`;

function addCompleted(cab, uid) {
  const working = buildMinutes(uid);
  const paused = pausedMinutes(uid);
  const dur = working + paused;
  const f = 0.04 + rnd() * 0.95;            // fraction through today's elapsed shift
  const completeExpr = atFrac(f);
  const startExpr = atFracMinus(f, dur);
  sessId++;
  sessions.push({ id: sessId, cabId: cab.id, jobId: cab.jobId, userId: uid,
    startExpr, completeExpr, frac: f, pausedSecs: paused * 60, active: false });
  const who = esc(userById(uid).name);
  scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'assembly', '${who}', ${completeExpr});`);
  scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'assembly_complete', '${who}', ${completeExpr});`);
  if (paused > 0 && rnd() < 0.8) {
    pauseId++;
    const r = pick(pauseReasons);
    w(`INSERT INTO pause_events (id, build_session_id, user_id, reason, note, paused_at, resumed_at) VALUES (${pauseId}, ${sessId}, ${uid}, '${r}', ${r === 'missing_part' ? "'left side panel short'" : 'NULL'}, ${atFracMinus(f, ri(2, 6))}, ${completeExpr});`);
  }
}

function addActive(cab, uid, pausedNow) {
  const elapsed = ri(3, buildMinutes(uid) - 1);
  sessId++;
  const pauseAgo = pausedNow ? ri(1, Math.max(2, elapsed - 1)) : 0;
  sessions.push({ id: sessId, cabId: cab.id, jobId: cab.jobId, userId: uid, startedAgo: elapsed, active: true, pausedNow, pauseAgo });
  if (pausedNow) {
    pauseId++;
    const r = pick(["material_wait", "missing_part", "help_needed", "machine"]);
    w(`INSERT INTO pause_events (id, build_session_id, user_id, reason, note, paused_at, resumed_at) VALUES (${pauseId}, ${sessId}, ${uid}, '${r}', NULL, datetime('now','-${pauseAgo} minutes'), NULL);`);
  }
}

// buckets + cabinets (4 per nest)
for (const job of jobs) {
  const nests = Math.ceil(job.size / 4);
  for (let n = 1; n <= nests; n++) {
    bucketId++;
    const inThis = Math.min(4, job.size - (n - 1) * 4);
    const allDone = job.staged && (n * 4 <= job.done);
    w(`INSERT INTO buckets (id, job_id, name, cabinet_count, status) VALUES (${bucketId}, ${job.id}, 'Nest ${n}', ${inThis}, ${allDone ? "'complete'" : "'pending'"});`);
    for (let cpos = 0; cpos < inThis; cpos++) {
      cabId++;
      cabinets.push({ id: cabId, jobId: job.id, bucketId, num: cabId, label: nextLabel(), status: "pending", flags: "[]" });
    }
  }
}
const jobCabs = (jid) => cabinets.filter((c) => c.jobId === jid);

// assign per-job state
for (const job of jobs) {
  const cs = jobCabs(job.id);
  let i = 0;
  // completed — all within today's shift so the day's total reflects ~200/day
  for (let d = 0; d < job.done; d++, i++) {
    cs[i].status = job.staged ? "staged" : "assembled";
    addCompleted(cs[i], pickAssembler());
  }
  // active now
  for (let a = 0; a < job.active; a++, i++) {
    cs[i].status = "assembling";
    addActive(cs[i], pickAssembler(), a % 3 === 0);
  }
  // ready-to-build (pending + to_assembly scan)
  for (let r = 0; r < job.ready; r++, i++) {
    cs[i].status = "pending";
    scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cs[i].jobId}, ${cs[i].bucketId}, ${cs[i].id}, 'to_assembly', 'Carlos', datetime('now','-${ri(10, 120)} minutes'));`);
  }
  // remaining stay pending (no scan)
}

// staging scans for staged cabinets (water spider Hector), a bit after assembly
cabinets.filter((c) => c.status === "staged").forEach((cab) => {
  const s = sessions.find((x) => x.cabId === cab.id && !x.active);
  // staged a bit after assembly, clamped to no later than "now"
  const stageExpr = s
    ? `MIN(datetime('now','-1 minutes'), datetime('now','start of day','+' || (CAST(${s.frac.toFixed(4)} * ${ELAPSED} AS INT) + ${ri(5, 25)}) || ' minutes'))`
    : `datetime('now','-${ri(30, 600)} minutes')`;
  scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'staging', 'Hector', ${stageExpr});`);
});

// ── FixIt defects (low rate ~3%) + a couple remake flags ──
const builtCabs = cabinets.filter((c) => c.status === "assembled" || c.status === "assembling");
const fixitSql = [];
function addFixit(cab, cause, desc, resolved, byId) {
  fixId++;
  const ago = ri(10, 300);
  const r = resolved ? `'resolved', 3, datetime('now','-${ri(1, 9)} minutes'), 'Re-cut on CNC, swapped in'` : `'open', NULL, NULL, NULL`;
  fixitSql.push(`INSERT INTO fixit_requests (id, cabinet_id, job_id, build_session_id, requested_by, root_cause, description, photo_key, status, resolved_by, resolved_at, resolution_note, created_at) VALUES (${fixId}, ${cab.id}, ${cab.jobId}, NULL, ${byId}, '${cause}', '${esc(desc)}', NULL, ${r}, datetime('now','-${ago} minutes'));`);
}
addFixit(pick(builtCabs), "cnc_error",      "Dado depth off by 1/8, shelf won't seat", false, 8);
addFixit(pick(builtCabs), "material_defect", "Veneer blowout on door face",            true,  6);
addFixit(pick(builtCabs), "transit_damage",  "Corner crushed in transit from EB",       true,  5);
addFixit(pick(builtCabs), "cnc_error",       "Hinge boring mislocated",                 true,  7);
addFixit(pick(builtCabs), "other",           "Missing 32mm shelf pins in nest",         false, 4);
const flagSql = [builtCabs[0], builtCabs[1]].filter(Boolean).map((c) => `UPDATE cabinets SET flags = '["remake"]' WHERE id = ${c.id};`);

// ── Emit SQL ──
const head = [
  "-- cab1.fabworks.app — HighCraft assembly-floor demo (generated by scripts/gen_seed_cab1.js)",
  "-- 5-person team, ~200 cabinets/day target (≈40 each, 3.6-5.4 cab/hr). Varied job",
  "-- sizes (12-70), several finished, one in-progress, one pending. Idempotent.",
  "",
  "DELETE FROM pause_events;", "DELETE FROM fixit_requests;", "DELETE FROM scans;",
  "DELETE FROM build_sessions;", "DELETE FROM sessions;", "DELETE FROM cabinets;",
  "DELETE FROM buckets;", "DELETE FROM jobs;", "DELETE FROM users WHERE email LIKE '%@highcraft.demo';",
  "",
];
for (const u of users) head.push(`INSERT INTO users (id, name, email, pin, role) VALUES (${u.id}, '${esc(u.name)}', '${u.email}', '${pinHash(u.pin)}', '${u.role}');  -- PIN ${u.pin}${u.pace ? ` (${u.pace} cab/hr)` : ""}`);
head.push("");
for (const job of jobs) head.push(`INSERT INTO jobs (id, job_number, job_name, cabinet_count, status) VALUES (${job.id}, '${job.number}', '${esc(job.name)}', ${job.size}, '${job.done >= job.size && job.active === 0 ? "complete" : "active"}');`);
head.push("");

const cabSql = cabinets.map((c) => `INSERT INTO cabinets (id, job_id, bucket_id, cabinet_number, label, status, flags) VALUES (${c.id}, ${c.jobId}, ${c.bucketId}, ${c.num}, '${esc(c.label)}', '${c.status}', '${c.flags}');`);
const sessSql = sessions.map((s) => s.active
  ? `INSERT INTO build_sessions (id, cabinet_id, job_id, user_id, started_at, paused_at, completed_at, total_paused_seconds) VALUES (${s.id}, ${s.cabId}, ${s.jobId}, ${s.userId}, datetime('now','-${s.startedAgo} minutes'), ${s.pausedNow ? `datetime('now','-${s.pauseAgo} minutes')` : "NULL"}, NULL, 0);`
  : `INSERT INTO build_sessions (id, cabinet_id, job_id, user_id, started_at, paused_at, completed_at, total_paused_seconds) VALUES (${s.id}, ${s.cabId}, ${s.jobId}, ${s.userId}, ${s.startExpr}, NULL, ${s.completeExpr}, ${s.pausedSecs});`);

const sql = [
  ...head,
  "-- buckets", ...out.filter((l) => l.startsWith("INSERT INTO buckets")), "",
  "-- cabinets", ...cabSql, "",
  "-- build sessions", ...sessSql, "",
  "-- scans", ...out.filter((l) => l.startsWith("INSERT INTO scans")), "",
  "-- pause events", ...out.filter((l) => l.startsWith("INSERT INTO pause_events")), "",
  "-- FixIt defects", ...fixitSql, "",
  "-- remake flags", ...flagSql, "",
].join("\n");
require("fs").writeFileSync(require("path").join(__dirname, "..", "schema", "seed_cab1.sql"), sql);

const done = sessions.filter((s) => !s.active);
const byUser = {};
done.forEach((s) => { const n = userById(s.userId).name; byUser[n] = (byUser[n] || 0) + 1; });
console.error("assemblers:", team.length, "| cabinets:", cabinets.length, "| completed:", done.length, "| active:", sessions.length - done.length);
console.error("completed per assembler:", Object.entries(byUser).map(([k, v]) => `${k}:${v}`).join("  "));
