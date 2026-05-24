CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  context_type TEXT NOT NULL,
  context_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notes_context ON notes(context_type, context_id);
