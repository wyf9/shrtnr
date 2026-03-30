# Changelog

## 0.3.2

### Bug fixes
- Analytics endpoint now returns 404 for nonexistent links instead of 200 with empty data

### Internal
- Extracted shared `ServiceResult` type, `json()`, and `fromServiceResult()` into `src/api/response.ts`, removing duplication across 8 files
- Removed dead `Click` type, unused `incrementClickCount` function, and redundant `top_links` type annotation
- Added 14 API tests: read-scope write denial, create-scope read denial, vanity slug redirects, invalid JSON body handling, and 404s for nonexistent resources

## 0.3.1

- Clarified Workers Builds setup: deploy command, build-time variables, and where to find the D1 database ID

## 0.3.0

### Mobile UI
- Responsive layout with slide-in drawer navigation on small screens
- Hamburger menu button in sticky mobile header
- Long URLs truncate instead of overflowing
- Progress bars hidden on mobile; numeric values remain visible
- API keys table scrolls horizontally rather than breaking layout

### Integrations
- Published `@oddbit/shrtnr-sdk` npm package for programmatic link management
- Published `@oddbit/shrtnr-mcp` npm package exposing link management to AI assistants via MCP stdio transport

### CI
- Shared release scripts in `scripts/` (`extract-changelog.sh`, `detect-releases.sh`)
- Unified `release-packages.yml` workflow covers both SDK and MCP releases via a dynamic matrix

## 0.2.0

### API keys
- App-managed API keys with SHA-256 hashed storage
- Dual authentication: Cloudflare Access (admin) and Bearer token (API keys)
- Scope-based authorization: create, read, or both
- API key management endpoints (create, list, delete)
- Per-user key isolation with owner-only deletion
- Raw key shown once at creation, prefix stored for display
- Automatic last-used tracking on each API call
- Admin UI page for key management with table overview, create/delete, and scope badges

### Vanity slugs
- Limit to one vanity slug per link
- Removed DELETE endpoint for vanity slugs

### Theme
- Semantic on-color CSS variables (--on-primary, --on-secondary, --on-danger) for consistent contrast across all themes
- Fixed light theme: buttons, toasts, and badges now render with correct text color

### Release
- Added concurrency guard to GitHub Actions release workflow

## 0.1.0

Initial release.

- URL shortening with auto-generated and vanity slugs
- Click analytics with country, referrer, device, and browser tracking
- Dashboard with top links, recent links, and country stats
- Link detail page with performance breakdown and QR code generation
- Disable/enable links via expiry timestamps
- Per-user theme switching (oddbit, dark, light)
- Settings page with slug length configuration and update checker
- Cloudflare Access authentication
- URL-based admin routing with browser history support
