import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import { applyMigrations, MIGRATIONS } from "../migrate";

beforeAll(async () => {
  // Start with a blank database: no tables at all
});

beforeEach(async () => {
  // Drop app tables to simulate a fresh database (skip internal Cloudflare tables)
  const appTables = [
    "links", "slugs", "clicks", "settings",
    "user_preferences", "api_keys", "_migrations", "d1_migrations",
  ];
  for (const name of appTables) {
    await env.DB.exec(`DROP TABLE IF EXISTS "${name}"`);
  }
});

describe("applyMigrations", () => {
  it("should create all tables on a blank database", async () => {
    await applyMigrations(env.DB);

    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_migrations' ORDER BY name"
    ).all<{ name: string }>();
    const names = tables.results.map((r) => r.name);

    expect(names).toContain("links");
    expect(names).toContain("slugs");
    expect(names).toContain("clicks");
    expect(names).toContain("settings");
    expect(names).toContain("user_preferences");
    expect(names).toContain("api_keys");
  });

  it("should record applied migrations in _migrations table", async () => {
    await applyMigrations(env.DB);

    const rows = await env.DB.prepare("SELECT name FROM _migrations ORDER BY id").all<{ name: string }>();
    expect(rows.results).toHaveLength(MIGRATIONS.length);
    expect(rows.results[0].name).toBe("0001_initial");
  });

  it("should skip already-applied migrations on second run", async () => {
    await applyMigrations(env.DB);
    // Running again should not throw (CREATE TABLE would fail without IF NOT EXISTS tracking)
    await applyMigrations(env.DB);

    const rows = await env.DB.prepare("SELECT name FROM _migrations").all();
    expect(rows.results).toHaveLength(MIGRATIONS.length);
  });

  it("should apply only new migrations when some already exist", async () => {
    // Simulate: migration 0001 already applied manually
    await applyMigrations(env.DB);

    // Drop api_keys and remove its migration record to simulate partial state
    await env.DB.exec("DROP TABLE IF EXISTS api_keys");
    await env.DB.prepare("DELETE FROM _migrations WHERE name = ?").bind("0003_api_keys").run();

    // Re-run should only apply the missing migration
    await applyMigrations(env.DB);

    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = 'api_keys'"
    ).all();
    expect(tables.results).toHaveLength(1);
  });

  it("should seed default settings on initial migration", async () => {
    await applyMigrations(env.DB);

    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'slug_default_length'").first<{ value: string }>();
    expect(row?.value).toBe("3");
  });

  it("should be compatible with existing d1_migrations table", async () => {
    // Simulate the wrangler-created d1_migrations table with 0001 already applied
    await env.DB.exec("CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
    await env.DB.prepare("INSERT INTO d1_migrations (name) VALUES (?)").bind("0001_initial.sql").run();

    // Manually create the tables that migration 0001 would have created
    await env.DB.exec("CREATE TABLE links (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, label TEXT, created_at INTEGER NOT NULL, expires_at INTEGER)");
    await env.DB.exec("CREATE TABLE slugs (id INTEGER PRIMARY KEY AUTOINCREMENT, link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE, slug TEXT NOT NULL UNIQUE, is_vanity INTEGER NOT NULL DEFAULT 0, click_count INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)");
    await env.DB.exec("CREATE INDEX idx_slugs_slug ON slugs(slug)");
    await env.DB.exec("CREATE INDEX idx_slugs_link_id ON slugs(link_id)");
    await env.DB.exec("CREATE TABLE clicks (id INTEGER PRIMARY KEY AUTOINCREMENT, slug_id INTEGER NOT NULL REFERENCES slugs(id) ON DELETE CASCADE, clicked_at INTEGER NOT NULL, referrer TEXT, country TEXT, device_type TEXT, browser TEXT)");
    await env.DB.exec("CREATE INDEX idx_clicks_slug_id ON clicks(slug_id)");
    await env.DB.exec("CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at)");
    await env.DB.exec("CREATE INDEX idx_clicks_country ON clicks(country)");
    await env.DB.exec("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    await env.DB.exec("INSERT INTO settings (key, value) VALUES ('slug_default_length', '3')");

    // Run applyMigrations: should detect 0001 from d1_migrations and skip it, apply 0002 + 0003
    await applyMigrations(env.DB);

    // api_keys should now exist (from 0003)
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = 'api_keys'"
    ).all();
    expect(tables.results).toHaveLength(1);

    // user_preferences should exist (from 0002)
    const upTables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = 'user_preferences'"
    ).all();
    expect(upTables.results).toHaveLength(1);
  });
});
