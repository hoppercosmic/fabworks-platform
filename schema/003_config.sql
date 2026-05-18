-- Phase 4: Tenant configuration — shop type, custom stations, entity labels
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  shop_type TEXT NOT NULL DEFAULT 'cabinet',
  entity_labels TEXT NOT NULL DEFAULT '{"l1":"Job","l2":"Bucket","l3":"Cabinet"}',
  stations TEXT NOT NULL DEFAULT '[]',
  l3_statuses TEXT NOT NULL DEFAULT '["pending","assembling","assembled","staged"]',
  l3_terminal_status TEXT NOT NULL DEFAULT 'staged',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
