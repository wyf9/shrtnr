# shrtnr: Open-Source URL Shortener on Cloudflare Workers

> A free, self-hosted URL shortener with click analytics, an admin dashboard, and AI integration. Runs on Cloudflare's free tier. Zero servers, zero monthly cost.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oddbit/shrtnr)

## Why shrtnr

Most URL shorteners either lock you into a SaaS with per-click pricing or require you to run a VPS. shrtnr runs on Cloudflare Workers + D1, both free tier. You own your data, your domain, and your short links.

It takes one click to deploy. You get a full admin UI, click analytics, a TypeScript SDK, and an MCP server for AI assistants: all from a single Cloudflare Worker.

## Features

- **Free hosting** on Cloudflare Workers + D1 (no VPS, no containers, no monthly bill)
- **Short slugs** starting at 3 characters (175,616 unique combinations at that length)
- **Vanity URLs** like `/my-campaign` alongside random slugs
- **Click analytics** with referrer, country, device, and browser tracking
- **Admin dashboard** for link management, analytics charts, and QR code generation
- **Multi-language admin UI** with English, Indonesian, and Swedish built in
- **API key authentication** with scoped Bearer tokens for programmatic access
- **TypeScript SDK** ([`@oddbit/shrtnr`](https://www.npmjs.com/package/@oddbit/shrtnr)) for Node.js and browser apps
- **MCP server** ([`@oddbit/shrtnr-mcp`](https://www.npmjs.com/package/@oddbit/shrtnr-mcp)) so Claude, Copilot, and other AI assistants can shorten URLs
- **SSO via Cloudflare Access** supporting Google, GitHub, OTP, SAML, OIDC, and any IdP
- **One-click deploy** with automatic database provisioning and migrations

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
5. Add a policy, for example:
   - **Action:** Allow
   - **Include rule:** Emails ending in `@yourcompany.com`
6. Under **Authentication**, enable at least one login method. "One-time PIN" works out of the box with no external IdP.

That's it. Visit `https://yourdomain.com` and Cloudflare Access will prompt you to log in.

### Login methods

Access supports Google, GitHub, Microsoft, Okta, SAML, OIDC, and a built-in one-time PIN. Configure whichever fits your team in the Zero Trust dashboard. See [Cloudflare's IdP guides](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/) for setup instructions.

## Integrations

### TypeScript SDK

Shorten URLs, manage links, and read analytics from any TypeScript or JavaScript app.

- Package: [`@oddbit/shrtnr`](https://www.npmjs.com/package/@oddbit/shrtnr)
- Documentation: [sdk/README.md](sdk/README.md)

### MCP Server (AI Integration)

Let Claude, GitHub Copilot, or any MCP-compatible AI assistant create and manage short links.

- Package: [`@oddbit/shrtnr-mcp`](https://www.npmjs.com/package/@oddbit/shrtnr-mcp)
- Documentation: [mcp/README.md](mcp/README.md)

Both packages cover the same link-management operations. Configuration and usage details are in their respective READMEs.

## API

Authentication model:

- **Cloudflare Access** grants full admin access (UI + all API endpoints).
- **API key Bearer tokens** grant scoped access to link-management endpoints only. Create keys from the admin UI under API Keys. Pass them as `Authorization: Bearer sk_...`.
- The health endpoint is public and does not require auth.

Administrative endpoints (settings, preferences, dashboard stats, key management) require Cloudflare Access and are not documented here.

| Method | Path | Description |
|---|---|---|
| `GET` | `/_/api/links` | List all short links |
| `POST` | `/_/api/links` | Shorten a URL (create a new link) |
| `GET` | `/_/api/links/:id` | Get a link with click stats |
| `PUT` | `/_/api/links/:id` | Update a link's URL, label, or expiry |
| `POST` | `/_/api/links/:id/slugs` | Add a vanity slug to a link |
| `POST` | `/_/api/links/:id/disable` | Disable a link |
| `GET` | `/_/api/links/:id/analytics` | Get click analytics (referrer, country, device, browser) |
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

shrtnr is built and maintained by **[Oddbit](https://oddbit.id)**, a software development studio in Sweden.

If you fork or build on this project, please keep the license, notice, and attribution files intact. Apache 2.0 requires this, and it's good open-source etiquette.

- Source: <https://github.com/oddbit/shrtnr>
- License: [Apache License 2.0](LICENSE)
- Attribution: [NOTICE](NOTICE)
