-- Asana webhook ingestion: registration storage + event queue

CREATE TABLE IF NOT EXISTS asana_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_gid TEXT NOT NULL UNIQUE,
  resource_gid TEXT NOT NULL,
  hook_secret TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS asana_event_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_gid TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_gid TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_event_queue_status ON asana_event_queue(status);
CREATE INDEX IF NOT EXISTS idx_event_queue_created ON asana_event_queue(created_at);
