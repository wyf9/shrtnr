-- Add pages (response static files instead of 30x redirection)

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  filename TEXT NOT NULL,
  http_status INTEGER NOT NULL DEFAULT 200,
  headers TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  disabled_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
