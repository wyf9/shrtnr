# Releases

The repository ships three independent release tracks: the Cloudflare Workers app and two SDKs. Each track is driven by a version bump on `main` and has its own self-contained GitHub Actions workflow.

## Release tracks

| Target                 | Manifest                      | Tag prefix | Workflow                 | Mode      |
| ---------------------- | ----------------------------- | ---------- | ------------------------ | --------- |
| Cloudflare Workers app | root `package.json`           | `app-v*`   | `release.yml`            | main-push |
| TypeScript / npm SDK   | `sdk/typescript/package.json` | `npm-v*`   | `release-sdk-npm.yml`    | main-push |
| Python / PyPI SDK      | `sdk/python/pyproject.toml`   | `py-v*`    | `release-sdk-python.yml` | main-push |

Shared bash lives in `scripts/read-version.sh` and `scripts/extract-changelog.sh`, called from each workflow.

## Bumping a version

Use `scripts/bump-sdk-version.sh <npm|python> <version>`:

```bash
scripts/bump-sdk-version.sh npm 0.7.3
scripts/bump-sdk-version.sh python 0.1.1
```

The script edits the right manifest, prepends a `## X.Y.Z` placeholder section to the matching `CHANGELOG.md`, and refreshes lockfiles. It does not commit, tag, or push. Replace the `TODO: fill in release notes.` bullet with real release notes before committing.

On "update the version" / "bump version" / "create a release":

1. Bump the version in the correct manifest per semver. Confirm the track if ambiguous.
2. Add a concise section to the matching `CHANGELOG.md`.
3. App track only: run `./scripts/spec-hash.sh` and update all SDK spec hashes in the same commit.
4. Commit. Do not push.

## Spec hash

Each SDK records the SHA-256 of the OpenAPI spec it was last regenerated against:

| SDK        | Manifest                      | Field                       |
| ---------- | ----------------------------- | --------------------------- |
| TypeScript | `sdk/typescript/package.json` | top-level `x-spec-hash`     |
| Python     | `sdk/python/pyproject.toml`   | `[tool.shrtnr]` `spec_hash` |

Spec changes stale both hashes. A root `package.json` version bump also drifts the hash because the spec embeds `info.version`.

Workflow on an API change:

1. Commit the API change. Run `./scripts/spec-hash.sh` for the new hash.
2. For each SDK, decide whether the change is surface or internal.
3. Run the parity check before bumping any hash.
4. Commit per SDK with a focused message.

### Parity check

- Models cover every `components.schemas` entry.
- Endpoints surface as methods on resource groups.
- Parameters match the spec.
- Tests pass.
- Cross-SDK parity holds.

## How the automation works

**main-push mode (app, npm, Python).** The workflow fires on any push to `main` that touches the track's manifest path. It compares the manifest across the triggering push range (`github.event.before..github.sha`) and exits cleanly if the manifest was not touched, so a multi-commit push where the version bump is not the last commit is still detected. If the manifest changed, it runs setup + build + test, publishes via OIDC, then creates the `<prefix>-v<version>` tag and a matching GitHub Release. Idempotency has two layers: the push-range check plus a tag-exists check that catches reruns.

## One-time registry setup

Both registries use OIDC trusted publishing; no long-lived tokens are stored anywhere.

- **npm**: package page for `@wyf9/shrtnr` → Settings → Trusted publishers. Publisher: GitHub Actions, repo `oddbit/shrtnr`, workflow `release-sdk-npm.yml`.
- **PyPI**: <https://pypi.org/manage/account/publishing/> → add a pending publisher. Project `wshrtnr`, owner `oddbit`, workflow `release-sdk-python.yml`.

## Adding a future SDK

1. Add it under `sdk/<language>/` following the existing layout conventions.
2. Extend `scripts/read-version.sh` with a case for the new manifest format if it is not already JSON / YAML / TOML.
3. Extend `scripts/bump-sdk-version.sh` with a new `<sdk>` identifier.
4. Add a new workflow `release-sdk-<name>.yml`, copying the closest existing track (main-push from npm/Python) and swapping the manifest path, tag prefix, and publish steps.
5. Document the one-time trusted-publisher setup.
