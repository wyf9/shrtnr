# Features

shrtnr delivers a complete URL shortener in a single Cloudflare Worker.

## Core capabilities

- **Free hosting**: runs on Cloudflare Workers + D1 (no VPS, no containers, no monthly bill).
- **Short slugs**: starting at 3 characters (32,768 unique combinations at that length).
- **Custom slugs**: like `/my-campaign`, alongside random slugs.
- **Configurable root redirect**: `/` can route visitors to a URL of your choice when they are not signed in.
- **Dynamic redirect rules**: `_redirects`-style placeholders (`:name`) and splat (`*` → `:splat`) for legacy migration paths. See [Dynamic Redirect Rules](/guide/redirect-rules).
- **Link expiry**: set an `expires_at` timestamp on a link.
- **Enable/disable**: stop or resume redirecting a link or slug at any time, without deleting it.

## Analytics

- **Click analytics**: track referrer, country, device, and browser.
- **Bot filtering**: User-Agent heuristic classification, toggleable via "Filter out bot traffic" in settings.
- **Self-referrer filtering**: toggleable "Filter out self-referrers" to keep same-origin clicks out of the numbers.
- **Referrer brand attribution**: clicks from in-app browsers (LinkedIn, X, Facebook, Instagram, and other Android/iOS apps) attribute to the originating brand domain instead of an opaque `android-app://` value.
- **Time ranges**: analytics support `24h`, `7d`, `30d`, `90d`, `1y`, and `all` windows, with a `delta_pct` versus the prior window of equal length.

## Admin dashboard

- **Link management**, analytics charts, and QR code generation.
- **Multi-language admin UI**: English, Indonesian, and Swedish built in.
- **Themes**: light/dark.
- **Per-user settings**: default slug length, default time range, analytics filter toggles, and more.

## Integrations and auth

- **API key authentication**: scoped Bearer tokens for programmatic access. Create keys in the admin UI under **API Keys**.
- **SDKs**: TypeScript ([`@wyf9/shrtnr`](https://oddb.it/shrtnr-npm-readme)) and Python ([`shrtnr`](https://oddb.it/shrtnr-pypi-readme)). See [SDKs](/integrations/sdks).
- **Built-in MCP server**: at `/_/mcp`, authorized via Cloudflare Access OAuth, so Claude, Copilot, and other AI assistants can create and manage short links. See [MCP Server](/integrations/mcp).
- **Browser extensions**: Chrome / Firefox extensions to shorten the active tab in one click. See [Browser Extensions](/integrations/browser-extensions).
- **OpenAPI spec**: the public API exposes an OpenAPI 3.1 spec at `/_/api/openapi.json` and an embedded Scalar API reference at `/_/api/docs`.

## Custom pages

Beyond redirect links, shrtnr can host static content directly on a given slug (with custom HTTP status codes and response headers), useful for verification files, simple landing pages, and the like.

## Deploy and operations

- **One-click deploy**: provisions the database and runs migrations automatically.
- **Continuous deployment**: Cloudflare Workers Builds redeploys on every push to the production branch, while database migrations are handled by a separate GitHub Actions workflow.

The full capability list evolves with each release; for the latest changes see the [CHANGELOG](https://github.com/wyf9/shrtnr/blob/main/CHANGELOG.md).
