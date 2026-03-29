# shrtnr

> A free, open-source, self-hosted URL shortener built on Cloudflare Workers + D1.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oddbit/shrtnr)

## Features

- **Zero infrastructure** — runs entirely on Cloudflare's free tier (Workers + D1)
- **Extremely short slugs** — 3-character random slugs by default (175,616 unique combinations)
- **Vanity slugs** — human-readable aliases like `/my-blog-post` alongside random slugs
- **Click analytics** — per-click tracking with referrer, country, device, and browser
- **Admin UI** — dashboard, link management, analytics charts, QR codes
- **Cloudflare Access auth** — SSO via Google, GitHub, OTP, SAML, or any IdP
- **One-click deploy** — click the button above and you're live

## Deploy

### One-click

Click the **Deploy to Cloudflare** button above. It will:

1. Fork the repo into your GitHub account
2. Create a D1 database and run migrations
3. Deploy the Worker

After deploying, set up authentication (see below).

### Manual

```bash
git clone https://github.com/oddbit/shrtnr
cd shrtnr
yarn install
yarn wrangler-login
yarn db:create          # copy the database_id into wrangler.toml
yarn db:migrate
yarn deploy
```

## Authentication

shrtnr uses [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/) to protect the admin UI. Access handles login, sessions, and identity — the Worker itself has zero auth code.

### Setup

1. Open **Zero Trust** in the [Cloudflare dashboard](https://one.dash.cloudflare.com/)
2. Go to **Access > Applications > Add an application**
3. Choose **Self-hosted**
4. Set the application domain to your short domain (e.g. `oddb.it`) with path `_/*`
5. Add a policy — for example:
   - **Action:** Allow
   - **Include rule:** Emails ending in `@yourcompany.com`
6. Under **Authentication**, enable at least one login method. "One-time PIN" works out of the box with no external IdP.

That's it. Visit `https://yourdomain.com` and Cloudflare Access will prompt you to log in.

### Login methods

Access supports Google, GitHub, Microsoft, Okta, SAML, OIDC, and a built-in one-time PIN — configure whichever fits your team in the Zero Trust dashboard. See [Cloudflare's IdP guides](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/) for setup instructions.

## Configuration

In `wrangler.toml`:

```toml
[vars]
SLUG_DEFAULT_LENGTH = "3"   # minimum: 3, also configurable from the admin UI
```

## API

All routes under `/_/api/` require authentication via Cloudflare Access.

| Method | Path | Description |
|---|---|---|
| `GET` | `/_/api/links` | List all links |
| `POST` | `/_/api/links` | Create a new link |
| `GET` | `/_/api/links/:id` | Get a link with stats |
| `PUT` | `/_/api/links/:id` | Update a link |
| `DELETE` | `/_/api/links/:id` | Delete a link |
| `POST` | `/_/api/links/:id/slugs` | Add a vanity slug |
| `DELETE` | `/_/api/links/:id/slugs/:slug` | Remove a vanity slug |
| `GET` | `/_/api/links/:id/analytics` | Get link click analytics |
| `GET` | `/_/api/dashboard` | Dashboard stats |
| `GET` | `/_/api/settings` | Get instance settings |
| `PUT` | `/_/api/settings` | Update settings |
| `GET` | `/_/health` | Health check (public) |

## How It Works

1. Visitor hits `yourdomain.com/aBc`
2. Worker looks up `aBc` in D1
3. Found and not expired: 301 redirect (click analytics recorded async via `waitUntil()`)
4. Not found: 404

## Attribution

shrtnr is developed and maintained by **[Oddbit](https://oddbit.id)**.

If you fork or build on this project, please keep the license, notice, and attribution files intact. Apache 2.0 requires this — and it's also just good open-source etiquette.

- Source: <https://github.com/oddbit/shrtnr>
- License: [Apache License 2.0](LICENSE)
- Attribution: [NOTICE](NOTICE)
