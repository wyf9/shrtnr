# Deploy

shrtnr runs on Cloudflare Workers + D1. You can deploy with one click, or manually from the command line.

::: tip Package manager
This project uses [Bun](https://bun.sh/) as its package manager. The commands below use `bun`. You can also invoke the Wrangler CLI directly with `npx wrangler`.
:::

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (the free tier is enough).
- [Bun](https://bun.sh/) installed (`node >= 22`).
- A domain (optional, but recommended for production).

## One-click deploy

Click the **Deploy to Cloudflare** button in the repository README. Cloudflare forks the repo, provisions a D1 database and KV namespace, and deploys the Worker.

::: warning Important: one-click deploy does not copy GitHub Actions workflows
When Cloudflare forks your repo, the workflows under `.github/workflows/` are **not copied**. This means the automatic migration workflow (`.github/workflows/migrate.yml`) does not exist in your fork. Without running migrations, the database schema is missing and the app will not work.
:::

After the initial deploy, apply the database migrations immediately:

```bash
cd shrtnr
bun install
bunx wrangler d1 migrations apply DB --remote
```

Then, every time you pull updates and push them to your fork, re-run migrations to apply any new schema changes:

```bash
bunx wrangler d1 migrations apply DB --remote
```

To automate this, copy `.github/workflows/migrate.yml` from the upstream repo into your fork and add the required secrets (see [Continuous deployment](#continuous-deployment) below).

## Manual deploy

```bash
git clone https://github.com/wyf9/shrtnr
cd shrtnr
bun install
bun run wrangler-login    # or: bunx wrangler login
bun run db:create         # create the D1 database shrtnr-db
bun run deploy            # deploy the Worker
bun run db:migrate:remote # apply migrations to the remote database
```

The corresponding npm scripts are defined in `package.json`:

| Script | Command |
|---|---|
| `dev` | `wrangler dev` |
| `deploy` | `wrangler deploy` |
| `wrangler-login` | `wrangler login` |
| `db:create` | `wrangler d1 create shrtnr-db` |
| `db:migrate:local` | `wrangler d1 migrations apply DB --local` |
| `db:migrate:remote` | `wrangler d1 migrations apply DB --remote` |
| `secret:put` | `wrangler secret put` |

## Bindings and configuration

The Worker bindings are defined in `wrangler.jsonc`:

- **D1 database**: binding `DB`, database name `shrtnr-db`, migrations dir `migrations/`.
- **KV namespace**: binding `SLUG_KV`, used for slug-to-link lookups.
- **Durable Object**: `MCP_OBJECT` (class `ShrtnrMCP`), hosting MCP agent sessions.
- **Static assets**: the `public/` directory is served as static assets.

> The KV namespace ID is resolved at deploy time by `scripts/resolve-bindings.sh`.

## Continuous deployment

Cloudflare [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) redeploys the Worker on every push to your production branch. Database migrations are handled by a separate GitHub Actions workflow, `.github/workflows/migrate.yml`, which triggers when Cloudflare's check suite completes successfully.

**If you used one-click deploy**: Cloudflare forks the repo but does not copy GitHub Actions workflows. To get automatic migrations, create the file manually:

1. In your fork, create `.github/workflows/migrate.yml` with the contents from the [upstream repo](https://github.com/oddbit/shrtnr/blob/main/.github/workflows/migrate.yml).
2. Add two repository secrets under GitHub **Settings > Secrets and variables > Actions**:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with **Workers Scripts: Edit** and **D1: Edit** permissions.
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID (visible in the dashboard URL or the right sidebar of any zone page).

Without these secrets you can still deploy: Workers Builds handles the code, and you run `bun run db:migrate:remote` manually when pushing schema changes.

## Next steps

After deploying, the admin UI ships **without built-in authentication**. Read [Access Control](/guide/access-control) first to protect it.
