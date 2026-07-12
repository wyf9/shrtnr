# Database & Migrations

shrtnr uses [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite-based) as its primary database, with a KV namespace for slug-lookup caching.

## Binding

The database binding is defined in `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "shrtnr-db",
    "migrations_dir": "migrations",
    "database_id": "..."
  }
]
```

- Binding name: `DB`
- Database name: `shrtnr-db`
- Migrations directory: `migrations/`

## Applying migrations

```bash
# Local development database
bun run db:migrate:local

# Remote (production) database
bun run db:migrate:remote
```

These are equivalent to:

```bash
bunx wrangler d1 migrations apply DB --local
bunx wrangler d1 migrations apply DB --remote
```

::: warning Migrations are required after one-click deploy
Cloudflare one-click deploy does not copy GitHub Actions workflows, so it does not migrate automatically. After the initial deploy, run `bun run db:migrate:remote` immediately, otherwise the schema is missing and the app will not work. See [Deploy](/guide/deploy).
:::

## Migration list

Migration files live in `migrations/`, named by sequence number and applied in order:

| File | Description |
|---|---|
| `0001_initial.sql` | Initial schema (links, slugs, etc.) |
| `0002_analytics_schema.sql` | Click analytics tables |
| `0003_drop_cached_counters.sql` | Remove cached counters |
| `0004_slug_text_pk.sql` | Slug switched to a text primary key |
| `0005_bundles.sql` | Bundles support |
| `0006_self_referrer_flag.sql` | Self-referrer flag |
| `0007_redirect_settings.sql` | Dynamic redirect rule settings |
| `0008_pages.sql` | Custom pages support |

## Migration conventions

::: tip Data safety
- Preserve all existing data.
- When recreating a table referenced by `ON DELETE CASCADE` foreign keys, save and drop dependent tables first, then restore after rename.
- Verify row counts are unchanged in all affected tables post-migration.
:::

## KV cache

Slug-to-link lookups are accelerated by the KV namespace `SLUG_KV` (bound in `wrangler.jsonc`), implemented in `src/kv/slug-cache.ts`. The namespace ID is resolved at deploy time by `scripts/resolve-bindings.sh`.
