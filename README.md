# shrtnr

> A free, open-source, self-hosted URL shortener built on Cloudflare Workers + D1.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oddbit/shrtnr)

## Features

- **Zero infrastructure** — runs entirely on Cloudflare's free tier (Workers + D1)
- **Extremely short slugs** — 3-character random slugs by default (175,616 unique combinations)
- **Vanity slugs** — human-readable aliases like `/my-blog-post` alongside random slugs
- **Click analytics** — per-click tracking with referrer, country, device, and browser
- **Admin UI** — dashboard, link management, analytics charts, QR codes
- **Multi-language** — English, Indonesian, and Swedish out of the box
- **API key auth** — scoped Bearer tokens for programmatic access
- **TypeScript SDK** — npm package for programmatic link management
- **MCP server** — AI assistant access via the Model Context Protocol
- **Cloudflare Access auth** — SSO via Google, GitHub, OTP, SAML, or any IdP
- **One-click deploy** — click the button above and you're live

## Deploy

### One-click

Click the **Deploy to Cloudflare** button above. Cloudflare will fork the repo, provision a D1 database, apply schema migrations, and deploy the Worker. No manual database setup required.

After deploying, set up authentication (see below).

### Manual

```bash
git clone https://github.com/oddbit/shrtnr
cd shrtnr
yarn install
yarn wrangler-login
yarn db:create
yarn deploy             # applies migrations and deploys the Worker
```

### Continuous deployment

The deploy button sets up [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) automatically. Cloudflare detects the `deploy` script in `package.json` and uses it as the deploy command. Each push to your production branch applies pending D1 migrations and redeploys the Worker.

## Authentication

shrtnr uses [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/) to protect the admin UI. Access handles login, sessions, and identity. The Worker reads the validated JWT to extract the user's email but does not verify signatures itself.

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

## Integrations

shrtnr exposes its link-management API through two integration surfaces.

### TypeScript SDK

For programmatic access from TypeScript or JavaScript applications:

- Package: `@oddbit/shrtnr` on [npm](https://www.npmjs.com/package/@oddbit/shrtnr)
- Documentation: [sdk/README.md](sdk/README.md)

### MCP Server

For AI assistant access via the [Model Context Protocol](https://modelcontextprotocol.io):

- Package: `@oddbit/shrtnr-mcp` on [npm](https://www.npmjs.com/package/@oddbit/shrtnr-mcp)
- Documentation: [mcp/README.md](mcp/README.md)

Both packages cover the same public link-management operations. Neither requires direct API access — configuration and usage details are in their respective READMEs above.

## API

Authentication model:

- **Cloudflare Access** grants full admin access (UI + all API endpoints).
- **API key Bearer tokens** grant scoped access to link-management endpoints only. Create keys from the admin UI under API Keys. Pass them as `Authorization: Bearer sk_...`.
- The health endpoint is public and does not require auth.

Administrative endpoints (settings, preferences, dashboard stats, key management) require Cloudflare Access and are not documented here.

| Method | Path | Description |
|---|---|---|
| `GET` | `/_/api/links` | List all links |
| `POST` | `/_/api/links` | Create a new link |
| `GET` | `/_/api/links/:id` | Get a link with stats |
| `PUT` | `/_/api/links/:id` | Update a link |
| `POST` | `/_/api/links/:id/slugs` | Add a vanity slug |
| `POST` | `/_/api/links/:id/disable` | Disable a link |
| `GET` | `/_/api/links/:id/analytics` | Get link click analytics |
| `GET` | `/_/health` | Health check (public) |

## Development

```bash
yarn install
yarn db:migrate         # apply migrations to local D1
yarn test
yarn dev
```

### SDK development

```bash
cd sdk
yarn install
yarn test
yarn build
```

### MCP server development

```bash
cd mcp
yarn install
yarn test
yarn build
```

## Attribution

shrtnr is developed and maintained by **[Oddbit](https://oddbit.id)**.

If you fork or build on this project, please keep the license, notice, and attribution files intact. Apache 2.0 requires this — and it's also just good open-source etiquette.

- Source: <https://github.com/oddbit/shrtnr>
- License: [Apache License 2.0](LICENSE)
- Attribution: [NOTICE](NOTICE)
