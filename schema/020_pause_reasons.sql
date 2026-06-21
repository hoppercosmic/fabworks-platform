-- cab1 assembly demo: capture WHY a build paused (Lean signal)
-- A build_session can pause/resume many times; each pause is one event.
CREATE TABLE IF NOT EXISTS pause_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  build_session_id INTEGER NOT NULL REFERENCES build_sessions(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,          -- material_wait, missing_part, defect, machine, break, help_needed, other
  note TEXT,
  paused_at TEXT NOT NULL DEFAULT (datetime('now')),
  resumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pause_events_session ON pause_events(build_session_id);
CREATE INDEX IF NOT EXISTS idx_pause_events_reason ON pause_events(reason);
CREATE INDEX IF NOT EXISTS idx_pause_events_open ON pause_events(build_session_id, resumed_at);
