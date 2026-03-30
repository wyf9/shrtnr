// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

// Embedded migrations: the Worker applies pending migrations on startup so that
// schema changes deploy automatically through Workers Builds without needing a
// separate CLI step or dashboard configuration.
//
// When adding a new migration:
// 1. Create the .sql file in migrations/ (for local dev with `wrangler d1 migrations apply`)
// 2. Add a matching entry here with the same SQL statements

export interface Migration {
  name: string;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    name: "0001_initial",
    statements: [
      `CREATE TABLE IF NOT EXISTS links (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        url         TEXT NOT NULL,
        label       TEXT,
        created_at  INTEGER NOT NULL,
        expires_at  INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS slugs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        link_id     INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
        slug        TEXT NOT NULL UNIQUE,
        is_vanity   INTEGER NOT NULL DEFAULT 0,
        click_count INTEGER NOT NULL DEFAULT 0,
        created_at  INTEGER NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS idx_slugs_slug ON slugs(slug)",
      "CREATE INDEX IF NOT EXISTS idx_slugs_link_id ON slugs(link_id)",
      `CREATE TABLE IF NOT EXISTS clicks (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        slug_id     INTEGER NOT NULL REFERENCES slugs(id) ON DELETE CASCADE,
        clicked_at  INTEGER NOT NULL,
        referrer    TEXT,
        country     TEXT,
        device_type TEXT,
        browser     TEXT
      )`,
      "CREATE INDEX IF NOT EXISTS idx_clicks_slug_id ON clicks(slug_id)",
      "CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at)",
      "CREATE INDEX IF NOT EXISTS idx_clicks_country ON clicks(country)",
      `CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('slug_default_length', '3')",
    ],
  },
  {
    name: "0002_user_preferences",
    statements: [
      `CREATE TABLE IF NOT EXISTS user_preferences (
        email TEXT NOT NULL,
        key   TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (email, key)
      )`,
    ],
  },
  {
    name: "0003_api_keys",
    statements: [
      `CREATE TABLE IF NOT EXISTS api_keys (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        email        TEXT NOT NULL,
        title        TEXT NOT NULL,
        key_prefix   TEXT NOT NULL,
        key_hash     TEXT NOT NULL UNIQUE,
        scope        TEXT NOT NULL,
        created_at   INTEGER NOT NULL,
        last_used_at INTEGER
      )`,
      "CREATE INDEX IF NOT EXISTS idx_api_keys_email ON api_keys(email)",
      "CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)",
    ],
  },
];

/** Collapse multiline SQL into a single line for D1's exec(). */
function sql(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Apply pending database migrations. Safe to call on every cold start: it
 * checks which migrations have already been applied and only runs new ones.
 *
 * Compatible with the `d1_migrations` table created by `wrangler d1 migrations apply`.
 * Migration names are matched with or without the `.sql` suffix.
 */
export async function applyMigrations(db: D1Database): Promise<void> {
  await db.exec(sql(
    "CREATE TABLE IF NOT EXISTS _migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL DEFAULT (datetime('now')))"
  ));

  // Collect applied migration names from both tables (ours and wrangler's)
  const applied = new Set<string>();

  const ours = await db.prepare("SELECT name FROM _migrations").all<{ name: string }>();
  for (const row of ours.results) {
    applied.add(row.name);
  }

  // Check wrangler's d1_migrations table if it exists
  const hasWranglerTable = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='d1_migrations'"
  ).first();
  if (hasWranglerTable) {
    const wrangler = await db.prepare("SELECT name FROM d1_migrations").all<{ name: string }>();
    for (const row of wrangler.results) {
      applied.add(row.name.replace(/\.sql$/, ""));
    }
  }

  // Apply pending migrations in order
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;

    for (const stmt of migration.statements) {
      await db.exec(sql(stmt));
    }

    await db.prepare("INSERT INTO _migrations (name) VALUES (?)").bind(migration.name).run();
  }
}
