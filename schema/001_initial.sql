-- FabWorks Phase 1 schema
-- Models the HighCraft value stream: jobs flow through stations via scans

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_number TEXT NOT NULL UNIQUE,
  job_name TEXT NOT NULL,
  routing TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sequence INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  station_id INTEGER NOT NULL REFERENCES stations(id),
  scanned_by TEXT,
  note TEXT,
  scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scans_job ON scans(job_id);
CREATE INDEX IF NOT EXISTS idx_scans_station ON scans(station_id);
CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(scanned_at);

-- Seed the 9-station value stream
INSERT INTO stations (slug, name, sequence) VALUES
  ('sales',       'Sales',                    1),
  ('engineering', 'Engineering',              2),
  ('warehouse',   'Ordering/Warehouse',       3),
  ('cnc',         'CNC / Edge Bander',        4),
  ('assembly',    'Assembly',                  5),
  ('custom',      'Custom Dept',              6),
  ('finishing',   'Finishing',                 7),
  ('staging',     'Staging',                   8),
  ('delivery',    'Delivery',                  9);
