# Architecture

shrtnr is a single Cloudflare Worker with its entry point at `src/index.tsx`. It dispatches by request host and path to the redirect, admin UI, public API, or MCP handlers.

## Directory layout

```
shrtnr/
├── src/                    Worker source
│   ├── index.tsx           Entry point: request dispatch
│   ├── redirect.ts         Short-link redirect logic
│   ├── redirect-rules.ts   Dynamic redirect rules (_redirects migration)
│   ├── slugs.ts            Slug generation and validation
│   ├── access.ts / auth.ts Cloudflare Access JWT verification and auth
│   ├── analytics-fill.ts   Click analytics backfill
│   ├── country.ts / ua.ts / referrer.ts / fingerprint.ts  Click dimension parsing
│   ├── qr.ts               QR code generation
│   ├── title-fetch.ts      Fetch the target URL title
│   ├── normalize-url.ts    URL normalization
│   ├── api/                Public API (Hono + zod-openapi)
│   ├── db/                 D1 repository layer (repository pattern)
│   ├── services/           Business logic layer
│   ├── kv/                 KV slug cache
│   ├── mcp/                MCP server and page
│   ├── pages/              Admin UI pages (JSX/SSR)
│   ├── components/         Admin UI shared components
│   ├── i18n/               Localization (en / id / sv / zh)
│   └── __tests__/          Vitest tests
├── migrations/             D1 database migrations
├── public/                 Static assets (icons, logos, manifest)
├── scripts/                Build and release scripts
├── sdk/                    Official SDKs (typescript / python / dart)
├── browser-extensions/     Chrome / Firefox extensions
├── docs/                   This documentation site (VitePress)
└── wrangler.jsonc          Cloudflare Worker configuration
```

## Layered design

The app roughly splits into three layers.

### API / page layer

- `src/api/`: the public Bearer-token API, built on [Hono](https://hono.dev/) with `@hono/zod-openapi`. `router.ts` mounts the `links` and `slugs` sub-apps and exposes `/openapi.json` and `/docs`.
- `src/pages/`: server-rendered admin UI pages (dashboard, links, link detail, API keys, settings, redirects, custom pages).
- `src/components/`: admin UI shared components (KPI cards, big charts, sparklines, range picker, etc.).

### Service layer (`src/services/`)

Encapsulates business logic independent of the transport layer:

| Module | Responsibility |
|---|---|
| `link-management.ts` | Link create, update, enable/disable, delete |
| `admin-management.ts` | Admin-side operations |
| `analytics.ts` | Click analytics aggregation |
| `trends.ts` | Trend and delta computation |
| `result.ts` | Unified result/error wrapper |

### Data layer (`src/db/`)

Repository wrappers over the D1 database:

| Repository | Table |
|---|---|
| `link-repository.ts` | Links |
| `slug-repository.ts` | Slugs |
| `click-repository.ts` | Click events |
| `api-key-repository.ts` | API keys |
| `setting-repository.ts` | Per-user settings |
| `page-repository.ts` | Custom pages |
| `filters.ts` | Analytics filter subqueries (bot / self-referrer / time range) |

The KV layer (`src/kv/slug-cache.ts`) provides a high-speed cache for slug-to-link lookups.

## MCP (`src/mcp/`)

- `server.ts`: registers all MCP tools (links, slugs, QR, analytics) and is the authoritative source for the tool list.
- `page.ts`: MCP-related page.

MCP sessions are hosted by the Durable Object `MCP_OBJECT` (class `ShrtnrMCP`) declared in `wrangler.jsonc`.

## Internationalization (`src/i18n/`)

All user-facing strings in admin pages/components go through `t()`, with translations in `en.ts`, `id.ts`, and `sv.ts`. English is the source of truth and the fallback.

## Related files

- [Contribution Guidelines](/contributing/guidelines) and [Releases](/contributing/releases): contribution conventions, release process, SDK parity rules.
- [`wrangler.jsonc`](https://github.com/wyf9/shrtnr/blob/main/wrangler.jsonc): Worker binding configuration.
