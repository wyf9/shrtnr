# API 概览

shrtnr 暴露一个公开的链接管理 API，使用 Bearer Token 认证。认证方式由**路由前缀**决定。

## 认证矩阵

| 路由 | 认证 | 说明 |
|---|---|---|
| `/_/api/*` | Bearer Token | 公开的链接管理 API。在管理 UI 的 **API Keys** 中创建密钥，并以 `Authorization: Bearer sk_...` 传递。 |
| `/_/mcp`（及 `mcp.<域名>`） | OAuth | 面向 AI 助手的 MCP 端点。认证由 Cloudflare Access 处理，见 [MCP 服务器](/zh/integrations/mcp)。 |
| `/_/admin/*` | 无内置认证 | 管理 UI 与管理专用 API。需外部保护（见 [访问控制](/zh/guide/access-control)）。不可用 API Key 调用。 |
| `/_/health` | 公开 | 健康检查。 |

## 认证

在管理 UI 的 **API Keys** 中创建带作用域的密钥，然后作为 Bearer Token 传递：

```bash
curl https://your-shrtnr.example.com/_/api/links \
  -H "Authorization: Bearer sk_your_api_key"
```

密钥前缀为 `sk_`。它的影响范围等同于会话令牌，请妥善保管。

## 交互式文档与规范

公开 API 使用 [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) 声明每个端点的类型化请求与响应模式，因此规范始终与服务端保持一致。

- **实时 API 参考**（内嵌 Scalar）：部署上的 **`/_/api/docs`**
- **OpenAPI 3.1 规范**（JSON）：部署上的 **`/_/api/openapi.json`**

::: tip 规范是唯一事实来源
SDK（[TypeScript](/zh/integrations/sdks)、Python）在 API 变更时从该规范重新生成。请以 `/_/api/openapi.json` 为准，而非硬编码端点细节。
:::

## 资源分组

公开 API 路由挂载于 `/_/api` 之下（见 `src/api/router.ts`）：

| 前缀 | 资源 | 实现 |
|---|---|---|
| `/_/api/links` | 链接的增删改查、分析、时间线、QR 码 | `src/api/links.ts` |
| `/_/api/slugs` | 短码查找、添加、启用/禁用、移除 | `src/api/slugs.ts` |

## 时间范围参数

链接的列表/详情/分析端点接受可选的 `?range=` 查询参数：

```
24h | 7d | 30d | 90d | 1y | all
```

给定后，它会限定 `total_clicks` 的统计窗口，并添加与上一等长窗口相比的 `delta_pct`，与管理 UI 的行为一致。

::: warning 公开 API 返回原始数据
公开 API 返回原始点击计数，**忽略** API Key 拥有者的过滤偏好（机器人过滤、自引用过滤）。因此 SDK 使用者拿到的是未过滤数据，除非自行后处理。管理端分析不受影响。
:::

## 校验行为

- 严格校验会拒绝带未知字段的请求体：`400 {"error": "Unknown field \"<name>\""}`。
- 路径参数 `:id` 若为非数字，返回 `404`。
- `url` 在链接创建/更新时上限 2048 字符。
- `slug` 必须匹配服务端校验器：首尾为 `[a-z0-9]`，中间还可包含 `.`、`_`、`~` 或 `-`。大写字母会在服务端转为小写。
- `expires_at` 拒绝负的 Unix 时间戳。

## 错误响应

错误以 JSON 形式返回，包含 `error` 字段。SDK 会将其映射为语言相应的错误类型（见 [SDK](/zh/integrations/sdks)）。

## 权限模型

按资源的归属限制生效：任何持有有效 API Key 的调用者都能读取链接、向链接追加自定义短码；但只有链接的拥有者才能修改、删除、禁用等。非拥有者的写操作返回 `403 Forbidden`。
