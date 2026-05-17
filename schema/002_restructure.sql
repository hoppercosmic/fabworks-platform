-- Phase 3: Restructure for Job → Bucket → Cabinet hierarchy
-- Stations are now scan event types, not a lookup table

DROP TABLE IF EXISTS scans;
DROP TABLE IF EXISTS stations;

-- Recreate jobs without routing column (flow is fluid, not fixed routes)
CREATE TABLE IF NOT EXISTS jobs_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_number TEXT NOT NULL UNIQUE,
  job_name TEXT NOT NULL,
  cabinet_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO jobs_new (id, job_number, job_name, status, created_at)
  SELECT id, job_number, job_name, status, created_at FROM jobs;
DROP TABLE jobs;
ALTER TABLE jobs_new RENAME TO jobs;

CREATE TABLE IF NOT EXISTS buckets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  name TEXT NOT NULL,
  cabinet_count INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(job_id, name)
);

CREATE TABLE IF NOT EXISTS cabinets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  bucket_id INTEGER REFERENCES buckets(id),
  cabinet_number INTEGER NOT NULL,
  label TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(job_id, cabinet_number)
);

CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  bucket_id INTEGER REFERENCES buckets(id),
  cabinet_id INTEGER REFERENCES cabinets(id),
  station TEXT NOT NULL,
  scanned_by TEXT,
  note TEXT,
  scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scans_job ON scans(job_id);
CREATE INDEX IF NOT EXISTS idx_scans_bucket ON scans(bucket_id);
CREATE INDEX IF NOT EXISTS idx_scans_cabinet ON scans(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_scans_station ON scans(station);
CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_buckets_job ON buckets(job_id);
CREATE INDEX IF NOT EXISTS idx_cabinets_job ON cabinets(job_id);
CREATE INDEX IF NOT EXISTS idx_cabinets_bucket ON cabinets(bucket_id);
