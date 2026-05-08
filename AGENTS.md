# AGENTS.md

## Package Manager

- Use Bun as the primary package manager.
- Install deps with `bun install`.
- Run scripts with `bun run <script>`.
- Add packages with `bun add <package>`.
- Commit `bun.lock`.

## Styling

- No inline styles for global design. Use centralized style files imported by components/pages.

## Releases

Release tracks:

| Target | Manifest | Tag prefix |
|---|---|---|
| Cloudflare Workers app | root `package.json` | `app-v*` |
| TypeScript/npm SDK | `sdk/typescript/package.json` | `npm-v*` |
| Python/PyPI SDK | `sdk/python/pyproject.toml` | `py-v*` |
| Dart/pub.dev SDK | `sdk/dart/pubspec.yaml` | `pub-v*` |

Use `scripts/bump-sdk-version.sh <npm|python|pub> <version>` to bump SDK versions. It edits the manifest, adds a placeholder CHANGELOG entry, and refreshes lockfiles. Replace `TODO: fill in release notes.` before commit.

On "update the version" / "bump version" / "create a release":

1. Bump version in the correct manifest per semver. Confirm track if ambiguous.
2. Add a concise section to the matching `CHANGELOG.md`.
3. App track only: run `./scripts/spec-hash.sh` and update all SDK spec hashes in the same commit.
4. Commit. Do not push.
5. Dart only: also create the local tag `git tag pub-v<version>`.

## SDKs

- SDK parity: any change to one SDK under `sdk/` must be evaluated and applied to the others.
- README parity: all SDK READMEs stay in lockstep, adjusted only for language idioms.

### Spec hash

Each SDK records the SHA-256 of the OpenAPI spec it was last regenerated against:

| SDK | Manifest | Field |
|---|---|---|
| TypeScript | `sdk/typescript/package.json` | top-level `x-spec-hash` |
| Python | `sdk/python/pyproject.toml` | `[tool.shrtnr]` `spec_hash` |
| Dart | `sdk/dart/pubspec.yaml` | leading comment `# x-spec-hash:` |

Spec changes stale all three hashes. A root `package.json` version bump also drifts the hash because the spec embeds `info.version`.

Workflow on API change:

1. Commit the API change. Run `./scripts/spec-hash.sh` for the new hash.
2. For each SDK, decide whether the change is surface or internal.
3. Run parity check before bumping any hash.
4. Commit per SDK with a focused message.

### Parity check

- Models cover every `components.schemas` entry.
- Endpoints surface as methods on resource groups.
- Parameters match spec.
- Tests pass.
- Cross-SDK parity holds.

## Testing

- Write tests for every requested behavior or change.
- Never modify or remove tests to accommodate code changes.

## Internationalization

- All user-facing strings in admin pages/components go through `t()` and live in translation files.
- Add new UI copy to translation files first, then reference via `t("namespace.key")`.

## Database migrations

- Preserve all existing data.
- When recreating a table referenced by FKs with `ON DELETE CASCADE`, save and drop dependent tables first, then restore after rename.
- Verify row counts unchanged in all affected tables post-migration.

## Repository

- Never force push.
- Use GPG-signed commits.
- If signing is unavailable or fails, do not create the commit. Instead output the exact `git commit` command with `-S` for the user to run later.
- No "Co-Authored-By" lines in commit messages.
- Keep commits logically grouped and focused.

## Writing rules

- Prefer specific words over general ones.
- No em dashes.
- No hollow intensifiers.
- Active voice by default.
- Split sentences with more than two clauses.
- No throat-clearing openers.

## Documentation

- Do not hardcode dynamic content that can drift. Reference the source directly.
