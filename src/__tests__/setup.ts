import { env } from "cloudflare:test";

// Migration SQL loaded from the migration file at build time via Vite's ?raw import.
import MIGRATION_SQL from "../../migrations/0001_initial.sql?raw";

let migrated = false;

export async function applyMigrations() {
  if (migrated) return;
  // Parse migration file into individual SQL statements.
  // Strip comments, join into single string, then split on semicolons.
  const sql = MIGRATION_SQL
    .split("\n")
    .filter((line: string) => !line.trimStart().startsWith("--"))
    .join(" ")
    .replace(/\s+/g, " ");
  const statements = sql
    .split(";")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);
  for (const stmt of statements) {
    await env.DB.exec(stmt);
  }
  migrated = true;
}

export async function resetData() {
  await env.DB.exec("DELETE FROM clicks");
  await env.DB.exec("DELETE FROM slugs");
  await env.DB.exec("DELETE FROM links");
  await env.DB.exec("DELETE FROM settings");
  await env.DB.exec("INSERT INTO settings (key, value) VALUES ('slug_default_length', '3')");
}
