# Changelog

## 0.1.0

First release of the Python SDK. Method-for-method parity with the TypeScript SDK.

- Sync `Shrtnr` client built on `httpx.Client` and async `AsyncShrtnr` client built on `httpx.AsyncClient`.
- Full link lifecycle: create, list, get, update, disable, enable, delete, list by owner.
- Slug management: add, disable, enable, remove, lookup by slug.
- Click analytics, QR code SVG, and service health check.
- Bundles: create, list, get, update, delete, archive, unarchive, analytics, membership management, reverse lookup.
- Bearer-token auth matching the TypeScript SDK, plus `X-Client: sdk` header.
- Typed with frozen dataclasses and `Literal` types; `py.typed` marker ships in the wheel.
- Works on Python 3.9 and later.
