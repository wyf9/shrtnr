# Contribution Guidelines

These conventions keep the codebase consistent. They apply to human contributors and automated agents alike.

## Package manager

- Use [Bun](https://bun.sh/) as the primary package manager.
- Install deps with `bun install`.
- Run scripts with `bun run <script>`.
- Add packages with `bun add <package>`.
- Commit `bun.lock`.

## Styling

- No inline styles for global design. Use centralized style files imported by components/pages (see `src/styles.ts`).

## Testing

- Write tests for every requested behavior or change.
- Never modify or remove tests to accommodate code changes.

Tests run in the real Workers runtime via `@cloudflare/vitest-pool-workers`. See [Development](/guide/development#testing).

## Internationalization

- All user-facing strings in admin pages/components go through `t()` and live in translation files.
- Add new UI copy to translation files first (`src/i18n/en.ts` as the source of truth), then reference via `t("namespace.key")`.
- English is the source of truth and the fallback; `id.ts` and `sv.ts` must stay in key parity.

## Database migrations

- Preserve all existing data.
- When recreating a table referenced by foreign keys with `ON DELETE CASCADE`, save and drop dependent tables first, then restore after rename.
- Verify row counts are unchanged in all affected tables post-migration.

See [Database & Migrations](/reference/database) for the migration list and commands.

## SDK parity

- Any change to one SDK under `sdk/` must be evaluated and applied to the others.
- All SDK READMEs stay in lockstep, adjusted only for language idioms.

Details on the release side live in [Releases](/contributing/releases).

## Repository rules

- Never force push.
- Use GPG-signed commits.
- If signing is unavailable or fails, do not create the commit. Instead output the exact `git commit` command with `-S` for the user to run later.
- No "Co-Authored-By" lines in commit messages.
- Keep commits logically grouped and focused.

## Writing rules

For docs, changelog entries, and user-facing copy:

- Prefer specific words over general ones.
- No em dashes.
- No hollow intensifiers.
- Active voice by default.
- Split sentences with more than two clauses.
- No throat-clearing openers.

## Documentation rules

- Do not hardcode dynamic content that can drift. Reference the source directly (for example, link to `src/mcp/server.ts` for the MCP tool list rather than copying it).
