# Dynamic Redirect Rules

If you are migrating from Cloudflare Pages `_redirects`, open **Settings** in the admin UI and paste your rules into **Dynamic Redirect Rules**.

## Syntax

- One rule per line: `<source> <destination> [status]`
- `:placeholder` in source and destination (for example `:name`, `:task`)
- `*` splat in source (last segment only), available as `:splat` in destination
- Optional status: `301`, `302`, `303`, `307`, `308` (default `302`)
- Lines starting with `#` are comments

## Example

```txt
# Email redirects
/t/m/:name https://siiway.org/go/mail?name=:name
/t/m/:name/:domain https://siiway.org/go/mail?name=:name&domain=:domain
/mail/:email https://siiway.org/go/mail?email=:email
/m64/:base64 https://siiway.org/go/mail?base64=:base64

# Path aliases
/a/* https://siiway.org/about/:splat
/m/* https://siiway.org/zh/members/:splat
```

## Separator and strict matching

A splat always sits **behind a path separator**. The rule `/m/*` therefore
requires the request path to continue past `/m/`:

- `/m` (no trailing slash) **never** matches `/m/*`, regardless of settings — so
  a static short link `/m` keeps taking precedence.
- `/m/` matches `/m/*` with an empty splat.
- `/m/team` matches `/m/*` with `:splat` = `team`.

The **Strict dynamic redirect matching** toggle in **Settings** controls the
empty-capture case. When enabled, every placeholder (`:name`) and splat (`*`)
must capture a **non-empty** value before the rule fires:

- Enabled: `/a/` does **not** match `/a/*` or `/a/:name`.
- Disabled (default): `/a/` matches `/a/*` (empty splat) or `/a/:name` (empty
  placeholder).

## Match order

Rules run on **unmatched public paths**, and **before** the single-segment short-slug fallback, so existing short links continue to work.

The matching flow is roughly:

1. Request hits an existing slug → redirect directly.
2. No slug match → try dynamic redirect rules (in definition order).
3. Still no match → fall back to single-segment slug logic / 404.

The relevant implementation lives in `src/redirect-rules.ts` and `src/redirect.ts`.
