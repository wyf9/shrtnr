# shrtnr

> A free, open-source, self-hosted URL shortener built on Cloudflare Workers + D1.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/oddbit/shrtnr)

## Features

- **Zero infrastructure** — runs entirely on Cloudflare's free tier (Workers + D1)
- **Extremely short slugs** — 3-character random slugs by default (175,616 unique combinations)
- **Vanity slugs** — human-readable aliases like `/my-blog-post` alongside random slugs
- **Click analytics** — per-click tracking with referrer, country, device, and browser
- **Admin UI** — dashboard, link management, analytics charts, QR codes
- **TypeScript SDK** — npm package for programmatic link management
- **MCP server** — AI assistant access via the Model Context Protocol
- **Cloudflare Access auth** — SSO via Google, GitHub, OTP, SAML, or any IdP
- **One-click deploy** — click the button above and you're live

## Deploy

### One-click

Click the **Deploy to Cloudflare** button above. It will:

1. Fork the repo into your GitHub account
2. Create a D1 database and run migrations
3. Deploy the Worker

After deploying, configure Workers Builds so that future pushes deploy automatically:

1. Go to **Workers & Pages > shrtnr > Settings**
2. Scroll to **Build** and click the edit icon on **Build configuration**
3. Set **Deploy command** to `yarn deploy`
4. Click the **+** next to **Variables and secrets** (in the Build section, not the runtime Variables and Secrets section at the top)
5. Add a variable: `D1_DATABASE_ID` with the value of your D1 database ID

To find your database ID, go to **Storage & databases > D1 SQL** and click your `shrtnr-db` database. The ID is shown on the overview page.

Then set up authentication (see below).

### Manual

```bash
git clone https://github.com/oddbit/shrtnr
cd shrtnr
yarn install
yarn wrangler-login
yarn db:create          # note the database_id from the output
yarn db:migrate
D1_DATABASE_ID=<your-database-id> yarn deploy
```

The deploy script reads `D1_DATABASE_ID` from the environment and injects it into `wrangler.toml` at build time. The real ID is never committed to git.

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

Default slug length is hardcoded to 3.

You can override it from the admin settings page at runtime.

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

- Public link-management endpoints accept Cloudflare Access auth or API key auth.
- Health endpoint is public and does not require auth.

Administrative and internal endpoints are intentionally not documented here.

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
