# Package Manager: Bun

This project has been migrated from **Yarn** to **Bun** as the primary package manager.

## Why Bun?

Bun provides:
- Faster installation and build times
- Better compatibility with modern JavaScript/TypeScript tooling
- Unified toolchain (installer, runner, test framework, bundler)
- Improved performance for development workflows

## Usage

### Install dependencies
```bash
bun install
```

### Run scripts
```bash
bun run <script-name>
```

Instead of:
```bash
yarn run <script-name>
```

### Add packages
```bash
bun add <package>
```

Instead of:
```bash
yarn add <package>
```

### Development

- **Build**: `bun run build`
- **Test**: `bun run test`
- **Deploy**: `bun run deploy`
- **Format**: `bun run fmt`
- **Lint**: `bun run lint`

## Lock file

- The lock file is `bun.lock` (replacing `yarn.lock`)
- Commit `bun.lock` to version control for reproducible builds

## CI/CD

GitHub Actions workflows should use `bun` commands instead of `yarn`.

If you encounter issues:
1. Delete `bun.lock`
2. Run `bun install` fresh
3. Commit the new lock file
