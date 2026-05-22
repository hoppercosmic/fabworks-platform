-- Phase 2: Build timer / workbench mode
CREATE TABLE IF NOT EXISTS build_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cabinet_id INTEGER NOT NULL REFERENCES cabinets(id),
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  paused_at TEXT,
  completed_at TEXT,
  total_paused_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_build_sessions_user_active ON build_sessions(user_id, completed_at);
CREATE INDEX idx_build_sessions_cabinet ON build_sessions(cabinet_id);
