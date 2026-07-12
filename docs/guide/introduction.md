# Introduction

**shrtnr** is a free, open-source, self-hosted URL shortener built on [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [D1](https://developers.cloudflare.com/d1/). It has built-in AI integration, click analytics, and an admin dashboard. It runs on Cloudflare's free tier: no servers, no monthly cost.

## Core philosophy

Most URL shorteners either lock you into a SaaS with per-click pricing or require you to operate a VPS. shrtnr takes a different route:

- **Zero servers**: the whole app is a single Cloudflare Worker, backed by a D1 (SQLite) database and a KV namespace.
- **Zero monthly cost**: it runs within the Cloudflare free tier by default.
- **You own your data**: you own your data, domain, and short links, and can export or migrate at any time.

It takes one click to deploy. You then get a full admin UI, click analytics, TypeScript / Python / Dart SDKs, and an MCP server for AI assistants, all from the same Worker.

## About this fork

::: warning Independently maintained fork
This repository ([wyf9/shrtnr](https://github.com/wyf9/shrtnr)) is a fork maintained independently on top of the upstream [oddbit/shrtnr](https://github.com/oddbit/shrtnr), with custom features and enhancements. It diverges from upstream in design philosophy and is maintained as a separate project rather than a pull request back upstream.
:::

The upstream **shrtnr** is built by [Oddbit](https://oddb.it/website), a senior-led studio shipping Cloudflare, Firebase, Flutter, and AI integrations for funded startups and scale-ups.

## Tech stack

| Component | Purpose |
|---|---|
| [Cloudflare Workers](https://developers.cloudflare.com/workers/) | Runtime that handles every request (redirects, admin UI, API, MCP) |
| [Cloudflare D1](https://developers.cloudflare.com/d1/) | SQLite database storing links, slugs, click events, etc. |
| [Cloudflare KV](https://developers.cloudflare.com/kv/) | High-speed cache for slug-to-link lookups |
| [Hono](https://hono.dev/) | Web framework, paired with `@hono/zod-openapi` to generate the API spec |
| [Durable Objects](https://developers.cloudflare.com/durable-objects/) | Hosts MCP agent sessions |
| [Zod](https://zod.dev/) | Request/response schema validation that also drives OpenAPI generation |

## Request routing overview

The app dispatches by route prefix:

| Route | Purpose | Auth |
|---|---|---|
| `/<slug>` | Short-link redirect | Public |
| `/_/admin/*` | Admin UI and admin API | Requires external protection (see [Access Control](/guide/access-control)) |
| `/_/api/*` | Public link-management API | Bearer token |
| `/_/mcp` (and `mcp.<domain>`) | MCP endpoint for AI assistants | OAuth (Cloudflare Access) |
| `/_/health` | Health check | Public |

## What's next

- [Features](/guide/features): the full capability list
- [Deploy](/guide/deploy): bring an instance online on Cloudflare
- [Access Control](/guide/access-control): protect your admin dashboard
