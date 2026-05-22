-- Phase 3: FixIt system for defect tracking
CREATE TABLE IF NOT EXISTS fixit_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cabinet_id INTEGER NOT NULL REFERENCES cabinets(id),
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  build_session_id INTEGER REFERENCES build_sessions(id),
  requested_by INTEGER NOT NULL REFERENCES users(id),
  root_cause TEXT NOT NULL CHECK(root_cause IN ('cnc_error', 'material_defect', 'transit_damage', 'other')),
  description TEXT,
  photo_key TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TEXT,
  resolution_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fixit_status ON fixit_requests(status);
CREATE INDEX idx_fixit_cabinet ON fixit_requests(cabinet_id);
CREATE INDEX idx_fixit_job ON fixit_requests(job_id);
