// Generates schema/seed_cab1.sql — realistic HighCraft assembly-floor demo data.
// Models a 6-person assembly team (2 high performers, 3 solid, 1 underperformer)
// working 8-9h shifts, 5 days/week, at ~2.2-3.25 cabinets/hour. Build-session
// durations are derived from each assembler's personal pace so the numbers and
// trends hold together. 4 jobs: J1 finished, J2 ~90%, J3 ~10%, J4 new/pending.
const crypto = require("crypto");
const SALT = "fw_fabworks_2026";
const pinHash = (p) => crypto.createHash("sha256").update(SALT + p).digest("hex");

// deterministic RNG so the dataset is stable across regenerations
let _s = 20260622;
const rnd = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const rf = (a, b) => a + rnd() * (b - a);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const esc = (s) => String(s).replace(/'/g, "''");

const out = [];
const w = (s) => out.push(s);

// ── Users ───────────────────────────────────────────────
// 6 assemblers with individual pace (cabinets/hour), + water spider, lead,
// supervisor, admin. `pace` drives build-session duration & today's volume.
const users = [
  { id: 1,  name: "Brad",   email: "brad@highcraft.demo",   pin: "1234", role: "admin" },
  { id: 2,  name: "Sam",    email: "sam@highcraft.demo",    pin: "3333", role: "supervisor" },
  { id: 3,  name: "Carlos", email: "carlos@highcraft.demo", pin: "4444", role: "lead" },
  { id: 4,  name: "Marcus", email: "marcus@highcraft.demo", pin: "1414", role: "user", pace: 3.20 }, // high
  { id: 5,  name: "Mateo",  email: "mateo@highcraft.demo",  pin: "1111", role: "user", pace: 3.05 }, // high
  { id: 6,  name: "Jordan", email: "jordan@highcraft.demo", pin: "2222", role: "user", pace: 2.85 }, // solid
  { id: 7,  name: "Diego",  email: "diego@highcraft.demo",  pin: "1212", role: "user", pace: 2.70 }, // solid
  { id: 8,  name: "Tony",   email: "tony@highcraft.demo",   pin: "1313", role: "user", pace: 2.55 }, // solid
  { id: 9,  name: "Luis",   email: "luis@highcraft.demo",   pin: "1515", role: "user", pace: 2.20 }, // under
  { id: 10, name: "Hector", email: "hector@highcraft.demo", pin: "1717", role: "user" },             // water spider
];
const team = users.filter((u) => u.pace);          // the 6 assemblers
const paceOf = (id) => users.find((u) => u.id === id).pace;
const userById = (id) => users.find((u) => u.id === id);

// deterministic weighted round-robin: faster assemblers complete proportionally
// more cabinets (smoothly interleaved), so the per-person volumes match pace.
const _acc = {};
team.forEach((u) => { _acc[u.id] = 0; });
const _paceSum = team.reduce((a, u) => a + u.pace, 0);
function pickAssembler() {
  team.forEach((u) => { _acc[u.id] += u.pace; });
  let best = team[0].id, bestv = -Infinity;
  for (const u of team) { if (_acc[u.id] > bestv) { bestv = _acc[u.id]; best = u.id; } }
  _acc[best] -= _paceSum;
  return best;
}

// minutes to build one cabinet for a given assembler (personal pace + small noise)
const buildMinutes = (uid) => Math.max(12, Math.round((60 / paceOf(uid)) + rf(-1.5, 2.0)));
// paused minutes per build: slower assemblers tend to stall a bit more
const pausedMinutes = (uid) => {
  const base = paceOf(uid) >= 3.0 ? ri(0, 5) : paceOf(uid) >= 2.5 ? ri(1, 8) : ri(4, 14);
  return rnd() < 0.55 ? base : 0;
};

// ── Cabinet label pools ─────────────────────────────────
const labels = [
  'Base 36" Sink','Base 24" 3-Drawer','Base 18" Door','Base 30" Door','Base 15" Drawer','Base 33" Corner','Base 12" Filler','Base 42" Lazy Susan',
  'Wall 30x36 Double','Wall 24x36 Single','Wall 30x18 Over-Range','Wall 12x36 Single','Wall 36x15 Bridge','Wall 24x30 Single','Wall 18x42 Single','Wall 33x36 Double',
  'Tall 24x84 Pantry','Tall 18x84 Broom','Tall 30x90 Oven','Tall 24x96 Pantry',
  'Vanity 48" Double','Vanity 30" Single','Vanity 36" Single','Vanity 60" Double',
];
let li = 0;
const nextLabel = () => labels[(li++) % labels.length];

// ── Jobs (each: nests of 4 cabinets) ────────────────────
const jobs = [
  { id: 1, number: "6789", name: "Somewhere House",          nests: 6, status: "complete", progress: "done" },
  { id: 2, number: "7012", name: "Lakeside Remodel",         nests: 5, status: "active",   progress: "almost" },
  { id: 3, number: "7045", name: "Maple Ave Kitchen",        nests: 5, status: "active",   progress: "early" },
  { id: 4, number: "7060", name: "Downtown Office Casework", nests: 4, status: "active",   progress: "pending" },
];

let bucketId = 0, cabId = 0, sessId = 0, scanId = 0, pauseId = 0, fixId = 0;
const cabinets = [];
const sessions = [];
const pauseReasons = ["material_wait", "missing_part", "machine", "help_needed", "break", "defect"];

// completed build session ending `agoMin` minutes ago, duration from pace
function addCompleted(cab, uid, agoMin) {
  const working = buildMinutes(uid);
  const paused = pausedMinutes(uid);
  const totalMin = working + paused;
  sessId++;
  sessions.push({ id: sessId, cabId: cab.id, jobId: cab.jobId, userId: uid,
    startedAgo: agoMin + totalMin, completedAgo: agoMin, pausedSecs: paused * 60, active: false });
  const who = esc(userById(uid).name);
  scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'assembly_complete', '${who}', datetime('now','-${agoMin} minutes'));`);
  scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'assembly', '${who}', datetime('now','-${agoMin} minutes'));`);
  const nEv = paused > 0 ? ri(1, 2) : (rnd() < 0.25 ? 1 : 0);
  for (let k = 0; k < nEv; k++) {
    pauseId++;
    const r = pick(pauseReasons);
    w(`INSERT INTO pause_events (id, build_session_id, user_id, reason, note, paused_at, resumed_at) VALUES (${pauseId}, ${sessId}, ${uid}, '${r}', ${r === 'missing_part' ? "'left side panel short'" : 'NULL'}, datetime('now','-${agoMin + ri(2, 8)} minutes'), datetime('now','-${agoMin + 1} minutes'));`);
  }
}

// active (in-progress) build session, optionally paused right now
function addActive(cab, uid, pausedNow) {
  const elapsed = ri(4, buildMinutes(uid) - 2);
  sessId++;
  const pauseAgo = pausedNow ? ri(2, Math.max(3, elapsed - 1)) : 0;
  sessions.push({ id: sessId, cabId: cab.id, jobId: cab.jobId, userId: uid, startedAgo: elapsed, active: true, pausedNow, pauseAgo });
  if (pausedNow) {
    pauseId++;
    const r = pick(["material_wait", "missing_part", "help_needed", "machine"]);
    w(`INSERT INTO pause_events (id, build_session_id, user_id, reason, note, paused_at, resumed_at) VALUES (${pauseId}, ${sessId}, ${uid}, '${r}', NULL, datetime('now','-${pauseAgo} minutes'), NULL);`);
  }
}

// ── Buckets + cabinets ──────────────────────────────────
for (const job of jobs) {
  for (let n = 1; n <= job.nests; n++) {
    bucketId++;
    w(`INSERT INTO buckets (id, job_id, name, cabinet_count, status) VALUES (${bucketId}, ${job.id}, 'Nest ${n}', 4, ${job.progress === 'done' ? "'complete'" : "'pending'"});`);
    for (let cpos = 1; cpos <= 4; cpos++) {
      cabId++;
      cabinets.push({ id: cabId, jobId: job.id, bucketId, num: cabId, label: nextLabel(), status: "pending", flags: "[]" });
    }
  }
}
const jobCabs = (jid) => cabinets.filter((c) => c.jobId === jid);

// helper: a "today" offset within the last ~7h so it stays in the current
// UTC day when the demo is refreshed mid-morning PT (run scripts/reset_demo.sh)
const todayAgo = () => ri(20, 7 * 60);
// prior shift-days (this work week): 1-3 full days back, within those shifts
const priorAgo = () => { const d = ri(1, 3); return d * 24 * 60 + ri(0, 9 * 60); };

// J1 finished: completed across the past few shifts + this morning
jobCabs(1).forEach((cab, i) => {
  cab.status = "staged";
  addCompleted(cab, pickAssembler(), i < 12 ? todayAgo() : priorAgo());
});
// J2 ~90%: 17 done today, 2 building now, 1 ready-pending
jobCabs(2).forEach((cab, i) => {
  if (i < 17) { cab.status = "assembled"; addCompleted(cab, pickAssembler(), todayAgo()); }
  else if (i < 19) { cab.status = "assembling"; addActive(cab, pickAssembler(), rnd() < 0.5); }
  else { cab.status = "pending"; scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'to_assembly', 'Carlos', datetime('now','-${ri(15, 120)} minutes'));`); }
});
// J3 ~10%: 2 done today, 2 building now, ~10 ready-pending, rest pending
jobCabs(3).forEach((cab, i) => {
  if (i < 2) { cab.status = "assembled"; addCompleted(cab, pickAssembler(), ri(20, 180)); }
  else if (i < 4) { cab.status = "assembling"; addActive(cab, pickAssembler(), i === 3); }
  else if (i < 14) { cab.status = "pending"; scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'to_assembly', 'Carlos', datetime('now','-${ri(5, 90)} minutes'));`); }
});
// J4 new/pending: nothing released

// staging scans for finished cabinets (water spider Hector)
cabinets.filter((c) => c.status === "staged").forEach((cab) => {
  scanId++; w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'staging', 'Hector', datetime('now','-${ri(30, 600)} minutes'));`);
});

// ── FixIt defects + remake flags ────────────────────────
const builtCabs = cabinets.filter((c) => c.status === "assembled" || c.status === "assembling");
const fixitSql = [];
function addFixit(cab, cause, desc, resolved, byId) {
  fixId++;
  const ago = ri(10, 240);
  const r = resolved ? `'resolved', 3, datetime('now','-${ri(1, 9)} minutes'), 'Re-cut on CNC, swapped in'` : `'open', NULL, NULL, NULL`;
  fixitSql.push(`INSERT INTO fixit_requests (id, cabinet_id, job_id, build_session_id, requested_by, root_cause, description, photo_key, status, resolved_by, resolved_at, resolution_note, created_at) VALUES (${fixId}, ${cab.id}, ${cab.jobId}, NULL, ${byId}, '${cause}', '${esc(desc)}', NULL, ${r}, datetime('now','-${ago} minutes'));`);
}
addFixit(pick(builtCabs), "cnc_error",       "Dado depth off by 1/8, shelf won't seat", false, 9);
addFixit(pick(builtCabs), "material_defect",  "Veneer blowout on door face",            false, 7);
addFixit(pick(builtCabs), "transit_damage",   "Corner crushed in transit from EB",       true,  5);
addFixit(pick(builtCabs), "cnc_error",        "Hinge boring mislocated",                 true,  8);
addFixit(pick(builtCabs), "other",            "Missing 32mm shelf pins in nest",         false, 6);
const flagSql = [builtCabs[0], builtCabs[1]].filter(Boolean).map((c) => `UPDATE cabinets SET flags = '["remake"]' WHERE id = ${c.id};`);

// ── Build SQL ───────────────────────────────────────────
const head = [
  "-- cab1.fabworks.app — HighCraft assembly-floor demo (generated by scripts/gen_seed_cab1.js)",
  "-- 6-person team, individual pace (2.2-3.25 cab/hr), 8-9h shifts. Build-session",
  "-- durations derived from each assembler's pace. 4 jobs: 6789 done, 7012 ~90%,",
  "-- 7045 ~10%, 7060 new. Idempotent: wipes demo rows then reinserts with explicit ids.",
  "",
  "DELETE FROM pause_events;", "DELETE FROM fixit_requests;", "DELETE FROM scans;",
  "DELETE FROM build_sessions;", "DELETE FROM sessions;", "DELETE FROM cabinets;",
  "DELETE FROM buckets;", "DELETE FROM jobs;", "DELETE FROM users WHERE email LIKE '%@highcraft.demo';",
  "",
];
for (const u of users) head.push(`INSERT INTO users (id, name, email, pin, role) VALUES (${u.id}, '${esc(u.name)}', '${u.email}', '${pinHash(u.pin)}', '${u.role}');  -- PIN ${u.pin}${u.pace ? ` (${u.pace} cab/hr)` : ""}`);
head.push("");
for (const job of jobs) head.push(`INSERT INTO jobs (id, job_number, job_name, cabinet_count, status) VALUES (${job.id}, '${job.number}', '${esc(job.name)}', ${job.nests * 4}, '${job.status}');`);
head.push("");

const cabSql = cabinets.map((c) => `INSERT INTO cabinets (id, job_id, bucket_id, cabinet_number, label, status, flags) VALUES (${c.id}, ${c.jobId}, ${c.bucketId}, ${c.num}, '${esc(c.label)}', '${c.status}', '${c.flags}');`);
const sessSql = sessions.map((s) => s.active
  ? `INSERT INTO build_sessions (id, cabinet_id, job_id, user_id, started_at, paused_at, completed_at, total_paused_seconds) VALUES (${s.id}, ${s.cabId}, ${s.jobId}, ${s.userId}, datetime('now','-${s.startedAgo} minutes'), ${s.pausedNow ? `datetime('now','-${s.pauseAgo} minutes')` : "NULL"}, NULL, 0);`
  : `INSERT INTO build_sessions (id, cabinet_id, job_id, user_id, started_at, paused_at, completed_at, total_paused_seconds) VALUES (${s.id}, ${s.cabId}, ${s.jobId}, ${s.userId}, datetime('now','-${s.startedAgo} minutes'), NULL, datetime('now','-${s.completedAgo} minutes'), ${s.pausedSecs});`);

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

// summary
const done = sessions.filter((s) => !s.active);
const byUser = {};
done.forEach((s) => { const n = userById(s.userId).name; byUser[n] = byUser[n] || { n: 0 }; byUser[n].n++; });
console.error("assemblers:", team.length, "| completed sessions:", done.length, "| active:", sessions.length - done.length);
console.error("per-assembler completed:", Object.entries(byUser).map(([k, v]) => `${k}:${v.n}`).join("  "));
