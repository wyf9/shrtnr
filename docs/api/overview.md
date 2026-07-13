# API Overview

shrtnr exposes a public link-management API authenticated with Bearer tokens. Authentication is determined by **route prefix**.

## Authentication matrix

| Route | Auth | Notes |
|---|---|---|
| `/_/api/*` | Bearer token | Public link-management API. Create keys in the admin UI under **API Keys** and pass them as `Authorization: Bearer sk_...`. |
| `/_/mcp` (and `mcp.<domain>`) | OAuth | MCP endpoint for AI assistants. Auth handled by Cloudflare Access; see [MCP Server](/integrations/mcp). |
| `/_/admin/*` | None built in | Admin UI and admin-only API. Protect externally (see [Access Control](/guide/access-control)). Not callable with API keys. |
| `/_/health` | Public | Health check. |

## Authentication

Create a scoped key in the admin UI under **API Keys**, then pass it as a Bearer token:

```bash
curl https://your-shrtnr.example.com/_/api/links \
  -H "Authorization: Bearer sk_your_api_key"
```

Keys are prefixed with `sk_`. A key has the same blast radius as a session token, so store it carefully.

## Interactive docs and spec

The public API uses [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) to declare typed request and response schemas for every endpoint, so the spec stays in lockstep with the server.

- **Live API reference** (embedded Scalar): **`/_/api/docs`** on your deployment
- **OpenAPI 3.1 spec** (JSON): **`/_/api/openapi.json`** on your deployment

::: tip The spec is the source of truth
The SDKs ([TypeScript](/integrations/sdks), Python, Dart) regenerate from this spec when the API changes. Treat `/_/api/openapi.json` as authoritative instead of hardcoding endpoint details.
:::

## Resource groups

Public API routes are mounted under `/_/api` (see `src/api/router.ts`):

| Prefix | Resource | Implementation |
|---|---|---|
| `/_/api/links` | Link CRUD, analytics, timeline, QR codes | `src/api/links.ts` |
| `/_/api/slugs` | Slug lookup, add, enable/disable, remove | `src/api/slugs.ts` |

## Time range parameter

The list/detail/analytics endpoints for links accept an optional `?range=` query parameter:

```
24h | 7d | 30d | 90d | 1y | all
```

When given, it scopes `total_clicks` to that window and adds a `delta_pct` versus the prior window of equal length, matching the admin UI.

::: warning The public API returns raw data
The public API returns raw click counts and **ignores** the API key owner's filter preferences (bot filtering, self-referrer filtering). SDK consumers therefore get unfiltered data unless they post-process. Admin-side analytics are unaffected.
:::

## Validation behavior

- Strict validation rejects request bodies with unknown fields: `400 {"error": "Unknown field \"<name>\""}`.
- A non-numeric path param `:id` returns `404`.
- `url` is capped at 2048 characters on link create/update.
- `slug` must match the server-side validator: it starts and ends with `[a-z0-9]`, and the middle may also contain `.`, `_`, `~`, or `-`. Uppercase input is lowercased server-side.
- `expires_at` rejects negative Unix timestamps.

## Error responses

Errors are returned as JSON with an `error` field. The SDKs map these to language-appropriate error types (see [SDKs](/integrations/sdks)).

## Permission model

Per-resource ownership applies: any caller with a valid API key can read links and append custom slugs to a link, but only the owner of a link can update, delete, disable, and so on. Non-owner writes return `403 Forbidden`.
