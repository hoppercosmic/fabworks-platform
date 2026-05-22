-- Phase 4: Role-based home screens via user preference
ALTER TABLE users ADD COLUMN home_page TEXT NOT NULL DEFAULT 'scan';
