-- Cabinet flags: issue markers (hold, remake, missing_part, priority)
ALTER TABLE cabinets ADD COLUMN flags TEXT NOT NULL DEFAULT '[]';
