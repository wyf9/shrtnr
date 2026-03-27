-- Initial schema for shrtnr

CREATE TABLE links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT NOT NULL,
  label       TEXT,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER
);

CREATE TABLE slugs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id     INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL UNIQUE,
  is_vanity   INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_slugs_slug ON slugs(slug);
CREATE INDEX idx_slugs_link_id ON slugs(link_id);

CREATE TABLE clicks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug_id     INTEGER NOT NULL REFERENCES slugs(id) ON DELETE CASCADE,
  clicked_at  INTEGER NOT NULL,
  referrer    TEXT,
  country     TEXT,
  device_type TEXT,
  browser     TEXT
);

CREATE INDEX idx_clicks_slug_id ON clicks(slug_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at);
CREATE INDEX idx_clicks_country ON clicks(country);

-- Settings table for instance configuration
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES ('slug_default_length', '3');
