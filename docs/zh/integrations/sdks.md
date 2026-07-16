# SDK

从你自己的代码里短链 URL、管理链接、读取分析数据。shrtnr 提供两套官方 SDK，均从同一份 OpenAPI 规范生成，保持接口一致。

| 语言 | 包名 | 说明 |
|---|---|---|
| TypeScript / JavaScript | [`@wyf9/shrtnr`](https://oddb.it/shrtnr-npm-readme) | 详见 `sdk/typescript/README.md` |
| Python（同步 + 异步，基于 httpx） | [`shrtnr`](https://oddb.it/shrtnr-pypi-readme) | 详见 `sdk/python/README.md` |

所有 SDK 都使用 [API Key](/zh/api/overview) 进行 Bearer Token 认证。API Key 在管理 UI 的 **API Keys** 中创建。

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

const link = await client.links.create({ url: "https://example.com/very-long-path" });
console.log(link.slugs[0].slug); // "a3x9"

// 获取近 7 天的点击数
const fresh = await client.links.get(link.id, { range: "7d" });

// 近 30 天完整分析
const stats = await client.links.analytics(link.id, { range: "30d" });
console.log(stats.totalClicks, stats.countries, stats.browsers);
```

## Python

```bash
pip install wshrtnr
```

同步用法：

```python
from wshrtnr import Shrtnr

client = Shrtnr(base_url="https://your-shrtnr.example.com", api_key="sk_your_api_key")

link = client.links.create(url="https://example.com/very-long-path")
print(link.slugs[0].slug)  # "a3x9"
```

异步用法：

```python
import asyncio
from wshrtnr import AsyncShrtnr

async def main():
    async with AsyncShrtnr(base_url="https://your-shrtnr.example.com", api_key="sk_...") as client:
        link = await client.links.create(url="https://example.com")
        print(link.id)

asyncio.run(main())
```

## 资源与方法

两套 SDK 都提供一致的资源分组：

### Links (`client.links`)

| 方法 | 说明 |
|---|---|
| `get(id, {range?})` | 获取链接及点击数 |
| `list({owner?, range?})` | 列出所有链接 |
| `create({url, label?, slugLength?, expiresAt?, allowDuplicate?})` | 创建短链 |
| `update(id, {url?, label?, expiresAt?})` | 更新 URL、标签或过期时间 |
| `disable(id)` / `enable(id)` | 停止 / 恢复重定向 |
| `delete(id)` | 永久删除 |
| `analytics(id, {range?})` | 按国家、设备、来源等维度的点击分析 |
| `timeline(id, {range?})` | 按时间分桶的点击数 |
| `qr(id, {slug?, size?})` | QR 码（SVG 字符串） |

### Slugs (`client.slugs`)

| 方法 | 说明 |
|---|---|
| `lookup(slug)` | 根据短码查找链接 |
| `add(linkId, slug)` | 添加自定义短码 |
| `disable / enable(linkId, slug)` | 禁用 / 启用短码 |
| `remove(linkId, slug)` | 移除短码 |

## 错误处理

各 SDK 都会在 4xx/5xx 响应时抛出错误类型（TypeScript 为 `ShrtnrError`），网络失败时 `status` 为 `0`：

```ts
import { ShrtnrError } from "@wyf9/shrtnr";

try {
  await client.links.get(99999);
} catch (err) {
  if (err instanceof ShrtnrError) {
    console.error(err.status);        // 404
    console.error(err.serverMessage); // "not found"
  }
}
```

## 另见

- [API 概览](/zh/api/overview)
- 部署上的实时 API 文档：`/_/api/docs`
- OpenAPI 规范：`/_/api/openapi.json`
