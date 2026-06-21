// Generates schema/seed_cab1.sql — realistic HighCraft assembly-floor demo data.
// 4 jobs: J1 finished, J2 almost finished, J3 ~10% in, J4 pending/new.
// 8 assemblers (maxed out) + lead + supervisor + admin. Completed/active builds,
// pause events with varied reasons, a few FixIt defects, a couple remake flags.
const crypto = require("crypto");
const SALT = "fw_fabworks_2026";
const pin = (p) => crypto.createHash("sha256").update(SALT + p).digest("hex");

// deterministic RNG so the dataset is stable
let _s = 1337;
const rnd = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const esc = (s) => String(s).replace(/'/g, "''");
const out = [];
const w = (s) => out.push(s);

// ── Users ───────────────────────────────────────────────
// 1 admin (Brad), 1 supervisor (Sam), 1 assembly lead (Carlos), 8 assemblers
const users = [
  { id: 1,  name: "Brad",   email: "brad@highcraft.demo",   pin: "1234", role: "admin" },
  { id: 2,  name: "Sam",    email: "sam@highcraft.demo",    pin: "3333", role: "supervisor" },
  { id: 3,  name: "Carlos", email: "carlos@highcraft.demo", pin: "4444", role: "lead" },
  { id: 4,  name: "Mateo",  email: "mateo@highcraft.demo",  pin: "1111", role: "user" },
  { id: 5,  name: "Jordan", email: "jordan@highcraft.demo", pin: "2222", role: "user" },
  { id: 6,  name: "Diego",  email: "diego@highcraft.demo",  pin: "1212", role: "user" },
  { id: 7,  name: "Tony",   email: "tony@highcraft.demo",   pin: "1313", role: "user" },
  { id: 8,  name: "Marcus", email: "marcus@highcraft.demo", pin: "1414", role: "user" },
  { id: 9,  name: "Luis",   email: "luis@highcraft.demo",   pin: "1515", role: "user" },
  { id: 10, name: "Priya",  email: "priya@highcraft.demo",  pin: "1616", role: "user" },
  { id: 11, name: "Hector", email: "hector@highcraft.demo", pin: "1717", role: "user" },
];
const assemblers = users.filter((u) => u.role === "user").map((u) => u.id);

// ── Cabinet label pools ─────────────────────────────────
const baseLabels = ['Base 36" Sink','Base 24" 3-Drawer','Base 18" Door','Base 30" Door','Base 15" Drawer','Base 33" Corner','Base 12" Filler','Base 42" Lazy Susan'];
const wallLabels = ['Wall 30x36 Double','Wall 24x36 Single','Wall 30x18 Over-Range','Wall 12x36 Single','Wall 36x15 Bridge','Wall 24x30 Single','Wall 18x42 Single','Wall 33x36 Double'];
const tallLabels = ['Tall 24x84 Pantry','Tall 18x84 Broom','Tall 30x90 Oven','Tall 24x96 Pantry'];
const vanityLabels = ['Vanity 48" Double','Vanity 30" Single','Vanity 36" Single','Vanity 60" Double'];
const allLabels = [...baseLabels, ...wallLabels, ...tallLabels, ...vanityLabels];
let li = 0;
const nextLabel = () => allLabels[(li++) % allLabels.length];

// ── Jobs (each: nests of 4 cabinets) ────────────────────
// progress drives per-cabinet state + build sessions
const jobs = [
  { id: 1, number: "6789", name: "Somewhere House",         nests: 6, status: "complete", progress: "done" },     // finished
  { id: 2, number: "7012", name: "Lakeside Remodel",        nests: 5, status: "active",   progress: "almost" },   // ~90%
  { id: 3, number: "7045", name: "Maple Ave Kitchen",       nests: 5, status: "active",   progress: "early" },    // ~10%
  { id: 4, number: "7060", name: "Downtown Office Casework", nests: 4, status: "active",   progress: "pending" },  // new/queued
];

// id counters
let bucketId = 0, cabId = 0, sessId = 0, scanId = 0, pauseId = 0, fixId = 0;
const cabinets = [];   // {id, jobId, bucketId, num, label, status, flags}
const sessions = [];   // built below
const pauseReasons = ["material_wait","missing_part","machine","help_needed","break","defect"];

// completed build session: started/completed minutes-ago, realistic pace (~20-26 min working)
function addCompleted(cab, userId, agoMin) {
  const working = ri(18, 30);
  const paused = rnd() < 0.5 ? ri(0, 12) : 0;
  const totalMin = working + paused;
  sessId++;
  sessions.push({
    id: sessId, cabId: cab.id, jobId: cab.jobId, userId,
    startedAgo: agoMin + totalMin, completedAgo: agoMin,
    pausedSecs: paused * 60, active: false, pausedNow: false,
  });
  // assembly_complete scan
  scanId++;
  w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'assembly_complete', '${esc(userById(userId).name)}', datetime('now','-${agoMin} minutes'));`);
  // 0-2 closed pause events with reasons
  const nEv = paused > 0 ? ri(1, 2) : (rnd() < 0.3 ? 1 : 0);
  for (let k = 0; k < nEv; k++) {
    pauseId++;
    const r = pick(pauseReasons);
    w(`INSERT INTO pause_events (id, build_session_id, user_id, reason, note, paused_at, resumed_at) VALUES (${pauseId}, ${sessId}, ${userId}, '${r}', ${r==='missing_part'?"'left side panel short'":'NULL'}, datetime('now','-${agoMin + ri(2,8)} minutes'), datetime('now','-${agoMin + 1} minutes'));`);
  }
}

// active (in-progress) build session, optionally paused right now
function addActive(cab, userId, agoMin, pausedNow) {
  sessId++;
  const pauseStartedAgo = pausedNow ? ri(2, Math.max(3, agoMin - 1)) : 0;
  sessions.push({ id: sessId, cabId: cab.id, jobId: cab.jobId, userId, startedAgo: agoMin, active: true, pausedNow, pauseStartedAgo });
  if (pausedNow) {
    pauseId++;
    const r = pick(["material_wait","missing_part","help_needed","machine"]);
    w(`INSERT INTO pause_events (id, build_session_id, user_id, reason, note, paused_at, resumed_at) VALUES (${pauseId}, ${sessId}, ${userId}, '${r}', NULL, datetime('now','-${pauseStartedAgo} minutes'), NULL);`);
  }
}

function userById(id) { return users.find((u) => u.id === id); }

// ── Build cabinets + per-job state ──────────────────────
let assignIdx = 0;
const nextAssembler = () => assemblers[(assignIdx++) % assemblers.length];

for (const job of jobs) {
  for (let n = 1; n <= job.nests; n++) {
    bucketId++;
    const bId = bucketId;
    w(`INSERT INTO buckets (id, job_id, name, cabinet_count, status) VALUES (${bId}, ${job.id}, 'Nest ${n}', 4, ${job.progress==='done'?"'complete'":"'pending'"});`);
    for (let cpos = 1; cpos <= 4; cpos++) {
      cabId++;
      const cab = { id: cabId, jobId: job.id, bucketId: bId, num: cabId, label: nextLabel(), status: "pending", flags: "[]" };
      cabinets.push(cab);
    }
  }
}

// assign states per job based on progress
function jobCabs(jid) { return cabinets.filter((c) => c.jobId === jid); }

// J1 finished: all assembled, completed over the last ~3 days
{
  const cs = jobCabs(1);
  cs.forEach((cab, i) => {
    cab.status = "staged"; // done + staged by water spider
    const ago = ri(60, 3 * 24 * 60); // 1h .. 3 days ago
    addCompleted(cab, nextAssembler(), ago);
  });
}

// J2 almost finished: 17 assembled (mostly today), 2 active now, 1 ready-pending
{
  const cs = jobCabs(2); // 20
  cs.forEach((cab, i) => {
    if (i < 17) {
      cab.status = "assembled";
      const ago = i < 10 ? ri(20, 8 * 60) : ri(8 * 60, 30 * 60); // today / yesterday-ish
      addCompleted(cab, nextAssembler(), ago);
    } else if (i < 19) {
      cab.status = "assembling";
      addActive(cab, nextAssembler(), ri(8, 55), rnd() < 0.5);
    } else {
      cab.status = "pending"; // ready to build
      scanId++;
      w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'to_assembly', 'Carlos', datetime('now','-${ri(15,120)} minutes'));`);
    }
  });
}

// J3 ~10% in: 2 assembled (today), 2 active now, ~10 ready-pending, rest pending
{
  const cs = jobCabs(3); // 20
  cs.forEach((cab, i) => {
    if (i < 2) {
      cab.status = "assembled";
      addCompleted(cab, nextAssembler(), ri(20, 180));
    } else if (i < 4) {
      cab.status = "assembling";
      addActive(cab, nextAssembler(), ri(5, 40), i === 3);
    } else if (i < 14) {
      cab.status = "pending"; // edge-banded, waiting to assemble
      scanId++;
      w(`INSERT INTO scans (id, job_id, bucket_id, cabinet_id, station, scanned_by, scanned_at) VALUES (${scanId}, ${cab.jobId}, ${cab.bucketId}, ${cab.id}, 'to_assembly', 'Carlos', datetime('now','-${ri(5,90)} minutes'));`);
    } // rest stay pending, no scan (not ready)
  });
}

// J4 pending/new: all pending, nothing released to assembly yet
// (no scans, no sessions — represents the next job queued on the floor)

// ── Emit users ──────────────────────────────────────────
const head = [];
head.push("-- cab1.fabworks.app — HighCraft assembly-floor demo (generated by scripts/gen_seed_cab1.js)");
head.push("-- 4 jobs: 6789 finished, 7012 almost done, 7045 ~10% in, 7060 pending/new.");
head.push("-- Idempotent: wipes demo rows then reinserts with explicit ids.");
head.push("");
head.push("DELETE FROM pause_events;");
head.push("DELETE FROM fixit_requests;");
head.push("DELETE FROM scans;");
head.push("DELETE FROM build_sessions;");
head.push("DELETE FROM sessions;");
head.push("DELETE FROM cabinets;");
head.push("DELETE FROM buckets;");
head.push("DELETE FROM jobs;");
head.push("DELETE FROM users WHERE email LIKE '%@highcraft.demo';");
head.push("");
for (const u of users) {
  head.push(`INSERT INTO users (id, name, email, pin, role) VALUES (${u.id}, '${esc(u.name)}', '${u.email}', '${pin(u.pin)}', '${u.role}');  -- PIN ${u.pin}`);
}
head.push("");
for (const job of jobs) {
  const cc = job.nests * 4;
  head.push(`INSERT INTO jobs (id, job_number, job_name, cabinet_count, status) VALUES (${job.id}, '${job.number}', '${esc(job.name)}', ${cc}, '${job.status}');`);
}
head.push("");

// buckets + scans + pause/fixit were pushed into `out`; cabinets emitted here
const cabSql = cabinets.map((c) =>
  `INSERT INTO cabinets (id, job_id, bucket_id, cabinet_number, label, status, flags) VALUES (${c.id}, ${c.jobId}, ${c.bucketId}, ${c.num}, '${esc(c.label)}', '${c.status}', '${c.flags}');`
);

// build_sessions
const sessSql = sessions.map((s) => {
  if (s.active) {
    const pausedAt = s.pausedNow ? `datetime('now','-${s.pauseStartedAgo} minutes')` : "NULL";
    const pausedSecs = 0;
    return `INSERT INTO build_sessions (id, cabinet_id, job_id, user_id, started_at, paused_at, completed_at, total_paused_seconds) VALUES (${s.id}, ${s.cabId}, ${s.jobId}, ${s.userId}, datetime('now','-${s.startedAgo} minutes'), ${pausedAt}, NULL, ${pausedSecs});`;
  }
  return `INSERT INTO build_sessions (id, cabinet_id, job_id, user_id, started_at, paused_at, completed_at, total_paused_seconds) VALUES (${s.id}, ${s.cabId}, ${s.jobId}, ${s.userId}, datetime('now','-${s.startedAgo} minutes'), NULL, datetime('now','-${s.completedAgo} minutes'), ${s.pausedSecs});`;
});

// ── FixIt defects (a few, mix of open/resolved) + remake flags ──
const fixitSql = [];
const someAssembled = cabinets.filter((c) => c.status === "assembled" || c.status === "assembling");
function addFixit(cab, cause, desc, resolved, byId) {
  fixId++;
  const ago = ri(10, 240);
  const resolvedCols = resolved
    ? `'resolved', 2, datetime('now','-${ri(1,9)} minutes'), 'Re-cut on CNC, swapped in'`
    : `'open', NULL, NULL, NULL`;
  fixitSql.push(`INSERT INTO fixit_requests (id, cabinet_id, job_id, build_session_id, requested_by, root_cause, description, photo_key, status, resolved_by, resolved_at, resolution_note, created_at) VALUES (${fixId}, ${cab.id}, ${cab.jobId}, NULL, ${byId}, '${cause}', '${esc(desc)}', NULL, ${resolvedCols}, datetime('now','-${ago} minutes'));`);
}
addFixit(pick(someAssembled), "cnc_error",      "Dado depth off by 1/8, shelf won't seat", false, 4);
addFixit(pick(someAssembled), "material_defect", "Veneer blowout on door face",            false, 6);
addFixit(pick(someAssembled), "transit_damage",  "Corner crushed in transit from EB",       true,  5);
addFixit(pick(someAssembled), "cnc_error",       "Hinge boring mislocated",                 true,  7);
addFixit(pick(someAssembled), "other",           "Missing 32mm shelf pins in nest",         false, 8);

// remake flags on 2 cabinets that had cnc errors
const remakeCabs = [someAssembled[0], someAssembled[1]].filter(Boolean);
const flagSql = remakeCabs.map((c) => `UPDATE cabinets SET flags = '["remake"]' WHERE id = ${c.id};`);

const sql = [
  ...head,
  "-- buckets",
  ...out.filter((l) => l.startsWith("INSERT INTO buckets")),
  "",
  "-- cabinets",
  ...cabSql,
  "",
  "-- build sessions",
  ...sessSql,
  "",
  "-- scans (to_assembly = ready, assembly_complete = done)",
  ...out.filter((l) => l.startsWith("INSERT INTO scans")),
  "",
  "-- pause events (Lean reason signal)",
  ...out.filter((l) => l.startsWith("INSERT INTO pause_events")),
  "",
  "-- FixIt defects",
  ...fixitSql,
  "",
  "-- remake flags",
  ...flagSql,
  "",
].join("\n");

require("fs").writeFileSync(require("path").join(__dirname, "..", "schema", "seed_cab1.sql"), sql);
// summary to stderr
const byStatus = {};
cabinets.forEach((c) => byStatus[c.status] = (byStatus[c.status]||0)+1);
console.error("cabinets:", cabinets.length, byStatus);
console.error("sessions:", sessions.length, "(active:", sessions.filter(s=>s.active).length, ")");
console.error("users:", users.length, "assemblers:", assemblers.length);
