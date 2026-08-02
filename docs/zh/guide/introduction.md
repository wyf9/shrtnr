# 介绍

**shrtnr** 是一个免费、开源、自托管的短链接服务，构建在 [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [D1](https://developers.cloudflare.com/d1/) 之上。它内置 AI 集成、点击分析和管理面板，跑在 Cloudflare 的免费额度上，无需服务器、无月度成本。

## 核心理念

大多数短链接服务要么把你锁定在按点击计费的 SaaS 中，要么要求你自行运维一台 VPS。shrtnr 选择另一条路：

- **零服务器**：整个应用是一个 Cloudflare Worker，配合 D1（SQLite）数据库与 KV 命名空间。
- **零月费**：默认运行在 Cloudflare 免费额度内。
- **数据自持**：你拥有自己的数据、域名和短链，随时可以导出或迁移。

只需一次点击即可部署，随后你就得到完整的管理 UI、点击分析、TypeScript / Python 两套 SDK，以及供 AI 助手使用的 MCP 服务器，全部来自同一个 Worker。

## 关于本 Fork

::: warning 独立维护的 Fork
本仓库 ([wyf9/shrtnr](https://github.com/wyf9/shrtnr)) 是在上游项目 [oddbit/shrtnr](https://github.com/oddbit/shrtnr) 基础上独立维护的 Fork，包含自定义功能与增强。它在设计理念上与上游有所分歧，作为独立项目维护，而非以 Pull Request 形式回合上游。
:::

上游项目 **shrtnr** 由 [Oddbit](https://oddb.it/website) 构建，这是一家以资深工程师主导的工作室，为初创与成长型公司交付 Cloudflare、Firebase、Flutter 和 AI 集成方案。

## 技术栈

| 组件                                                                  | 用途                                              |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| [Cloudflare Workers](https://developers.cloudflare.com/workers/)      | 运行时，处理所有请求（重定向、管理 UI、API、MCP） |
| [Cloudflare D1](https://developers.cloudflare.com/d1/)                | SQLite 数据库，存储链接、短码、点击事件、分组等   |
| [Cloudflare KV](https://developers.cloudflare.com/kv/)                | 短码到链接的高速查找缓存                          |
| [Hono](https://hono.dev/)                                             | Web 框架，配合 `@hono/zod-openapi` 生成 API 规范  |
| [Durable Objects](https://developers.cloudflare.com/durable-objects/) | 承载 MCP agent 会话                               |
| [Zod](https://zod.dev/)                                               | 请求/响应模式校验，同时驱动 OpenAPI 规范生成      |

## 请求路由概览

应用根据路由前缀区分处理逻辑：

| 路由                        | 用途                    | 认证                                                  |
| --------------------------- | ----------------------- | ----------------------------------------------------- |
| `/<slug>`                   | 短链重定向              | 公开                                                  |
| `/_/admin/*`                | 管理 UI 与管理 API      | 需外部保护（见 [访问控制](/zh/guide/access-control)） |
| `/_/api/*`                  | 公开的链接管理 API      | Bearer Token                                          |
| `/_/mcp`（及 `mcp.<域名>`） | 面向 AI 助手的 MCP 端点 | OAuth（Cloudflare Access）                            |
| `/_/health`                 | 健康检查                | 公开                                                  |

## 接下来

- [功能特性](/zh/guide/features)：完整能力清单
- [部署](/zh/guide/deploy)：把实例上线到 Cloudflare
- [访问控制](/zh/guide/access-control)：保护你的管理面板
