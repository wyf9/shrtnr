# Development

This project uses [Bun](https://bun.sh/) as its package manager, [Wrangler](https://developers.cloudflare.com/workers/wrangler/) as the local runtime, and [Vitest](https://vitest.dev/) to run tests.

## Requirements

- [Bun](https://bun.sh/) 1.3+ (`node >= 22`)
- A Cloudflare account (for remote deploys; not needed for local development)

## Getting started

```bash
bun install
bun run db:migrate:local   # apply migrations to the local D1
bun run test               # run tests
bun run dev                # start the local dev server (wrangler dev)
```

`bun run dev` starts `wrangler dev`, which emulates the Workers runtime, D1, KV, and Durable Objects locally.

::: tip Auth in local dev mode
When `ACCESS_AUD` is unset (the default in local dev), the Worker skips JWT verification and falls back to dev mode, so you can open the admin UI without configuring Cloudflare Access.
:::

## Common scripts

| Script | Description |
|---|---|
| `bun run dev` | Start the local dev server |
| `bun run deploy` | Deploy to Cloudflare |
| `bun run test` | Run tests once (`vitest run`) |
| `bun run test:watch` | Run tests in watch mode |
| `bun run db:migrate:local` | Apply migrations to the local D1 |
| `bun run db:migrate:remote` | Apply migrations to the remote D1 |
| `bun run emit-spec` | Emit the OpenAPI spec (`scripts/emit-spec.ts`) |

## Testing

Tests use [`@cloudflare/vitest-pool-workers`](https://developers.cloudflare.com/workers/testing/vitest-integration/) and run in the real Workers runtime. Configuration lives in `vitest.config.mts`; tests are in `src/__tests__/`.

```bash
bun run test          # single run
bun run test:watch    # watch mode
```

::: warning Testing conventions
- Write tests for every requested behavior or change.
- Never modify or remove tests to accommodate code changes.
:::

## SDK development

The SDKs live in separate directories under `sdk/` (`typescript/`, `python/`, `dart/`):

```bash
cd sdk/typescript
bun install
bun run test
bun run build
```

::: tip SDK parity
- Any change to one SDK must be evaluated and applied to the others.
- All SDK READMEs stay in lockstep, adjusted only for language idioms.
- Each SDK records the SHA-256 of the OpenAPI spec it was last generated against (spec hash). An API change stales all three hashes.
:::

For detailed contribution and release conventions, see [Contribution Guidelines](/contributing/guidelines) and [Releases](/contributing/releases).

## Documentation development

This documentation site is built with [VitePress](https://vitepress.dev/); the source is in `docs/`:

```bash
bun run docs:dev       # preview the docs locally
bun run docs:build     # build the static site
bun run docs:preview   # preview the build output
```
