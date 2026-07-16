# Browser Extensions

Chrome and Firefox extensions that shorten the active tab into your **own** self-hosted shrtnr deployment in one click. The source lives in the repository's `browser-extensions/` directory.

One source tree, two store-ready artifacts. The popup shortens the active tab into your shrtnr deployment, copies the short URL to the clipboard, and renders a server-side QR code on demand.

## What it does

- **Toolbar action**: shortens the active tab and copies the short URL to your clipboard.
- **QR code**: generated for new short links by your shrtnr server (no client-side QR library, no third-party API).
- **Settings page**: for `baseUrl + apiKey`, with a connection test that hits `GET /_/api/links`.
- **First-run flow**: on install, the options page opens automatically and surfaces a one-click deploy CTA for users who don't yet have a shrtnr.

The extension talks to **your own** shrtnr deployment. Nothing leaves the extension except the calls you configure.

## Install (end users)

- Chrome / Edge / Brave / Opera / Vivaldi: [Chrome Web Store](https://oddb.it/shrtnr-ext-chrome)
- Firefox: [Firefox Add-ons](https://oddb.it/shrtnr-ext-firefox)

After install, click the toolbar icon. The popup either:

- shows the configure form (first run) — paste your shrtnr URL and an API key from `/_/admin/api-keys`, or
- shortens the current tab and copies the short URL.

## Permissions

Declared in `manifests/base.json`:

| Permission | Why |
|---|---|
| `activeTab` | Read the active tab URL on toolbar click. Less invasive than the broader `tabs` permission and does not show "read your browsing history" in the install dialog. |
| `storage` | Persist the configured `baseUrl + apiKey` to `chrome.storage.sync`. |
| `clipboardWrite` | Copy the short URL to the clipboard via `navigator.clipboard.writeText`. |
| `optional_host_permissions: ["*://*/*"]` | Granted **at runtime** against the user's actual `baseUrl` after they save it in options. The install dialog therefore lists no host permissions. |

The extension does not request `host_permissions` at install time.

## Storage

A single key in `chrome.storage.sync`:

```json
{
  "config": {
    "baseUrl": "https://your-shrtnr.example.com",
    "apiKey": "sk_..."
  }
}
```

::: warning
The API key has the same blast radius as a session token. `chrome.storage.sync` is encrypted at rest by the browser but readable by extension code.
:::

## Development

```bash
cd browser-extensions
bun install
bun run test          # all unit + component tests
bun run build         # produces dist/{chrome,firefox}/ and dist/{chrome,firefox}.zip
```

Watch mode:

```bash
bun run dev:chrome    # esbuild watch mode, output dist/chrome/
bun run dev:firefox   # esbuild watch mode, output dist/firefox/
```

- Chrome: `chrome://extensions/` → enable Developer mode → Load unpacked → pick `dist/chrome`.
- Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → pick `dist/firefox/manifest.json`.

::: tip Dependency
The extension depends on the **published** `@wyf9/shrtnr` from npm, like any external consumer. It never imports the local `sdk/typescript` source. SDK changes ship to npm first; the extension picks them up on the next version bump.
:::

## Architecture

```
browser-extensions/
  src/
    background.ts         MV3 service worker, opens options on first install
    popup/                toolbar popup (Preact)
    options/              full-page settings (Preact)
    components/           shared form + CTA banner
    api.ts                wrapper around @oddbit/shrtnr
    storage.ts            chrome.storage.sync wrapper
    i18n/                 en / id / sv / zh translations
  manifests/              base + per-target overrides (chrome, firefox)
  build.mjs               esbuild + manifest merge + zipper
```

Full details in `browser-extensions/README.md`.
