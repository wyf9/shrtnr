# 功能特性

shrtnr 在一个 Cloudflare Worker 中提供了完整的短链接服务能力。

## 核心能力

- **免费托管**：运行在 Cloudflare Workers + D1 上（无 VPS、无容器、无月费）。
- **短码**：从 3 个字符起（该长度下有 32,768 种唯一组合）。
- **自定义短码**：例如 `/my-campaign`，可与随机短码并存。
- **可配置的根重定向**：当访客未登录时，`/` 可路由到你指定的 URL。
- **动态重定向规则**：支持 `_redirects` 风格的占位符（`:name`）与通配符（`*` → `:splat`），便于迁移旧的重定向路径。详见 [动态重定向规则](/zh/guide/redirect-rules)。
- **链接过期**：可为链接设置 `expires_at` 过期时间。
- **启用/禁用**：随时停止或恢复某条链接或短码的重定向，无需删除。

## 分析

- **点击分析**：追踪来源 (referrer)、国家、设备与浏览器。
- **机器人过滤**：基于 User-Agent 的启发式识别，可在设置中开关"过滤机器人流量"。
- **自引用过滤**：可开关"过滤自引用来源"，避免同源点击污染统计。
- **来源品牌归因**：来自 App 内置浏览器的点击（如 LinkedIn、X、Facebook、Instagram 等 Android/iOS App）会归因到对应品牌域名，而非不透明的 `android-app://` 值。
- **时间范围**：分析支持 `24h`、`7d`、`30d`、`90d`、`1y`、`all` 等窗口，并给出与上一等长窗口的环比变化 (`delta_pct`)。

## 分组 (Bundles)

- 将相关链接归为一组（例如某个项目的博客文章、GitHub 仓库、npm 页面和文档），以追踪它们的**合并**互动数据。
- 一条链接可以属于多个分组。
- 分组支持归档/取消归档、合并分析、稀疏折线图 (sparkline) 与顶部链接预览。

## 管理面板

- **链接管理**、分析图表与 QR 码生成。
- **多语言管理 UI**：内置英语、印尼语、瑞典语。
- **主题**：浅色/深色。
- **每用户设置**：默认短码长度、默认时间范围、分析过滤开关等。

## 集成与认证

- **API Key 认证**：带作用域的 Bearer Token，用于程序化访问。可在管理 UI 的 **API Keys** 中创建。
- **SDK**：TypeScript ([`@oddbit/shrtnr`](https://oddb.it/shrtnr-npm-readme))、Python ([`shrtnr`](https://oddb.it/shrtnr-pypi-readme))、Dart/Flutter ([`shrtnr`](https://oddb.it/shrtnr-pub-readme))。详见 [SDK](/zh/integrations/sdks)。
- **内置 MCP 服务器**：位于 `/_/mcp`，通过 Cloudflare Access OAuth 授权，让 Claude、Copilot 等 AI 助手创建和管理短链。详见 [MCP 服务器](/zh/integrations/mcp)。
- **浏览器扩展**：Chrome / Firefox 扩展，一键短链当前标签页。详见 [浏览器扩展](/zh/integrations/browser-extensions)。
- **OpenAPI 规范**：公开 API 在 `/_/api/openapi.json` 暴露 OpenAPI 3.1 规范，并在 `/_/api/docs` 提供内嵌的 Scalar API 参考。

## 自定义页面 (Pages)

除了重定向短链，shrtnr 还支持在指定短码上直接托管静态内容（自定义 HTTP 状态码与响应头），适合返回校验文件、简单的落地页等。

## 部署与运维

- **一键部署**：自动置备数据库并执行迁移。
- **持续部署**：Cloudflare Workers Builds 在每次推送生产分支时重新部署，数据库迁移由 GitHub Actions 工作流单独处理。

完整能力清单会随版本演进，最新变更请参考 [CHANGELOG](https://github.com/wyf9/shrtnr/blob/main/CHANGELOG.md)。
