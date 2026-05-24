CREATE TABLE IF NOT EXISTS daily_briefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_date TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(brief_date)
);
