# SDKs

Shorten URLs, manage links, and read analytics from your own code. shrtnr provides three official SDKs, all generated from the same OpenAPI spec so their interfaces stay consistent.

| Language | Package | Notes |
|---|---|---|
| TypeScript / JavaScript | [`@oddbit/shrtnr`](https://oddb.it/shrtnr-npm-readme) | See `sdk/typescript/README.md` |
| Python (sync + async, on httpx) | [`shrtnr`](https://oddb.it/shrtnr-pypi-readme) | See `sdk/python/README.md` |
| Dart / Flutter | [`shrtnr`](https://oddb.it/shrtnr-pub-readme) | See `sdk/dart/README.md` |

All SDKs authenticate with an [API key](/api/overview) as a Bearer token. Create API keys in the admin UI under **API Keys**.

## TypeScript

```bash
npm install @oddbit/shrtnr
```

```ts
import { ShrtnrClient } from "@oddbit/shrtnr";

const client = new ShrtnrClient({
  baseUrl: "https://your-shrtnr.example.com",
  apiKey: "sk_your_api_key",
});

const link = await client.links.create({ url: "https://example.com/very-long-path" });
console.log(link.slugs[0].slug); // "a3x9"

// Get a 7-day click count
const fresh = await client.links.get(link.id, { range: "7d" });

// Full analytics for the last 30 days
const stats = await client.links.analytics(link.id, { range: "30d" });
console.log(stats.totalClicks, stats.countries, stats.browsers);
```

## Python

```bash
pip install shrtnr
```

Synchronous:

```python
from shrtnr import Shrtnr

client = Shrtnr(base_url="https://your-shrtnr.example.com", api_key="sk_your_api_key")

link = client.links.create(url="https://example.com/very-long-path")
print(link.slugs[0].slug)  # "a3x9"
```

Async:

```python
import asyncio
from shrtnr import AsyncShrtnr

async def main():
    async with AsyncShrtnr(base_url="https://your-shrtnr.example.com", api_key="sk_...") as client:
        link = await client.links.create(url="https://example.com")
        print(link.id)

asyncio.run(main())
```

## Dart / Flutter

```bash
dart pub add shrtnr
```

```dart
import 'package:shrtnr/shrtnr.dart';

final client = ShrtnrClient(
  baseUrl: 'https://your-shrtnr.example.com',
  apiKey: 'sk_your_api_key',
);

final link = await client.links.create(url: 'https://example.com/very-long-path');
print(link.slugs.first.slug); // 'a3x9'

client.close();
```

## Resources and methods

All three SDKs expose consistent resource groups:

### Links (`client.links`)

| Method | Description |
|---|---|
| `get(id, {range?})` | Get a link with click count |
| `list({owner?, range?})` | List all links |
| `create({url, label?, slugLength?, expiresAt?, allowDuplicate?})` | Create a short link |
| `update(id, {url?, label?, expiresAt?})` | Update URL, label, or expiry |
| `disable(id)` / `enable(id)` | Stop / resume redirecting |
| `delete(id)` | Permanently delete |
| `analytics(id, {range?})` | Click breakdown by country, device, referrer, etc. |
| `timeline(id, {range?})` | Click counts bucketed over time |
| `qr(id, {slug?, size?})` | QR code as an SVG string |
| `bundles(id)` | Bundles this link belongs to |

### Slugs (`client.slugs`)

| Method | Description |
|---|---|
| `lookup(slug)` | Find a link by slug |
| `add(linkId, slug)` | Add a custom slug |
| `disable / enable(linkId, slug)` | Disable / enable a slug |
| `remove(linkId, slug)` | Remove a slug |

### Bundles (`client.bundles`)

| Method | Description |
|---|---|
| `get(id, {range?})` | Get a bundle with click summary |
| `list({archived?, range?})` | List bundles |
| `create({name, description?, icon?, accent?})` | Create a bundle |
| `update(id, {...})` | Update metadata |
| `delete(id)` | Permanently delete |
| `archive / unarchive(id)` | Archive / unarchive |
| `analytics(id, {range?})` | Combined click analytics |
| `links(id)` | List links in the bundle |
| `addLink / removeLink(id, linkId)` | Add / remove a link |

## Error handling

Every SDK throws a language-appropriate error type on 4xx/5xx responses (`ShrtnrError` in TypeScript); network failures use `status: 0`:

```ts
import { ShrtnrError } from "@oddbit/shrtnr";

try {
  await client.links.get(99999);
} catch (err) {
  if (err instanceof ShrtnrError) {
    console.error(err.status);        // 404
    console.error(err.serverMessage); // "not found"
  }
}
```

## See also

- [API Overview](/api/overview)
- Live API docs on your deployment: `/_/api/docs`
- OpenAPI spec: `/_/api/openapi.json`
