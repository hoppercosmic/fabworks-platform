-- Phase 7: Cabinet metadata for assembly info
ALTER TABLE cabinets ADD COLUMN accessories TEXT;
ALTER TABLE cabinets ADD COLUMN notes TEXT;
ALTER TABLE cabinets ADD COLUMN assembly_sheet_url TEXT;
