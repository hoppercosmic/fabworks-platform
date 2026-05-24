ALTER TABLE jobs ADD COLUMN finish_details TEXT;
ALTER TABLE jobs ADD COLUMN engineering_notes TEXT;
ALTER TABLE jobs ADD COLUMN external_links TEXT DEFAULT '[]';
