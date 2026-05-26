-- FabWorks <-> Asana entity mappings

CREATE TABLE IF NOT EXISTS asana_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fw_type TEXT NOT NULL,
  fw_id INTEGER NOT NULL,
  asana_gid TEXT NOT NULL,
  asana_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(fw_type, fw_id)
);

CREATE INDEX IF NOT EXISTS idx_asana_mappings_gid ON asana_mappings(asana_gid);
