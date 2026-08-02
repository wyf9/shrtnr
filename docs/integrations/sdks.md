# SDKs

Shorten URLs, manage links, and read analytics from your own code. shrtnr provides two official SDKs, both generated from the same OpenAPI spec so their interfaces stay consistent.

| Language                        | Package                                             | Notes                          |
| ------------------------------- | --------------------------------------------------- | ------------------------------ |
| TypeScript / JavaScript         | [`@wyf9/shrtnr`](https://oddb.it/shrtnr-npm-readme) | See `sdk/typescript/README.md` |
| Python (sync + async, on httpx) | [`wshrtnr`](https://oddb.it/shrtnr-pypi-readme)     | See `sdk/python/README.md`     |

All SDKs authenticate with an [API key](/api/overview) as a Bearer token. Create API keys in the admin UI under **API Keys**.

## TypeScript

```bash
npm install @wyf9/shrtnr
```

```ts
import { ShrtnrClient } from "@wyf9/shrtnr";

const client = new ShrtnrClient({
  baseUrl: "https://your-shrtnr.example.com",
  apiKey: "sk_your_api_key",
});

const link = await client.links.create({
  url: "https://example.com/very-long-path",
});
console.log(link.slugs[0].slug); // "a3x9"

// Get a 7-day click count
const fresh = await client.links.get(link.id, { range: "7d" });

// Full analytics for the last 30 days
const stats = await client.links.analytics(link.id, { range: "30d" });
console.log(stats.totalClicks, stats.countries, stats.browsers);
```

## Python

```bash
pip install wshrtnr
```

Synchronous:

```python
from wshrtnr import Shrtnr

client = Shrtnr(base_url="https://your-shrtnr.example.com", api_key="sk_your_api_key")

link = client.links.create(url="https://example.com/very-long-path")
print(link.slugs[0].slug)  # "a3x9"
```

Async:

```python
import asyncio
from wshrtnr import AsyncShrtnr

async def main():
    async with AsyncShrtnr(base_url="https://your-shrtnr.example.com", api_key="sk_...") as client:
        link = await client.links.create(url="https://example.com")
        print(link.id)

asyncio.run(main())
```

## Resources and methods

Both SDKs expose consistent resource groups:

### Links (`client.links`)

| Method                                                            | Description                                        |
| ----------------------------------------------------------------- | -------------------------------------------------- |
| `get(id, {range?})`                                               | Get a link with click count                        |
| `list({owner?, range?})`                                          | List all links                                     |
| `create({url, label?, slugLength?, expiresAt?, allowDuplicate?})` | Create a short link                                |
| `update(id, {url?, label?, expiresAt?})`                          | Update URL, label, or expiry                       |
| `disable(id)` / `enable(id)`                                      | Stop / resume redirecting                          |
| `delete(id)`                                                      | Permanently delete                                 |
| `analytics(id, {range?})`                                         | Click breakdown by country, device, referrer, etc. |
| `timeline(id, {range?})`                                          | Click counts bucketed over time                    |
| `qr(id, {slug?, size?})`                                          | QR code as an SVG string                           |

### Slugs (`client.slugs`)

| Method                           | Description             |
| -------------------------------- | ----------------------- |
| `lookup(slug)`                   | Find a link by slug     |
| `add(linkId, slug)`              | Add a custom slug       |
| `disable / enable(linkId, slug)` | Disable / enable a slug |
| `remove(linkId, slug)`           | Remove a slug           |

## Error handling

Every SDK throws a language-appropriate error type on 4xx/5xx responses (`ShrtnrError` in TypeScript); network failures use `status: 0`:

```ts
import { ShrtnrError } from "@wyf9/shrtnr";

try {
  await client.links.get(99999);
} catch (err) {
  if (err instanceof ShrtnrError) {
    console.error(err.status); // 404
    console.error(err.serverMessage); // "not found"
  }
}
```

## See also

- [API Overview](/api/overview)
- Live API docs on your deployment: `/_/api/docs`
- OpenAPI spec: `/_/api/openapi.json`
