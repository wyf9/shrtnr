# 项目架构

shrtnr 是一个单一的 Cloudflare Worker，入口为 `src/index.tsx`。它根据请求的主机与路径，分发到重定向、管理 UI、公开 API 或 MCP 处理器。

## 目录结构

```
shrtnr/
├── src/                    Worker 源码
│   ├── index.tsx           入口：请求分发
│   ├── redirect.ts         短链重定向逻辑
│   ├── redirect-rules.ts   动态重定向规则（_redirects 迁移）
│   ├── slugs.ts            短码生成与校验
│   ├── access.ts / auth.ts Cloudflare Access JWT 校验与认证
│   ├── analytics-fill.ts   点击分析数据填充
│   ├── country.ts / ua.ts / referrer.ts / fingerprint.ts  点击维度解析
│   ├── qr.ts               QR 码生成
│   ├── title-fetch.ts      抓取目标 URL 标题
│   ├── normalize-url.ts    URL 规范化
│   ├── api/                公开 API（Hono + zod-openapi）
│   ├── db/                 D1 仓储层（repository 模式）
│   ├── services/           业务逻辑层
│   ├── kv/                 KV 短码缓存
│   ├── mcp/                MCP 服务器与页面
│   ├── pages/              管理 UI 页面 (JSX/SSR)
│   ├── components/         管理 UI 共享组件
│   ├── i18n/               多语言（en / id / sv / zh）
│   └── __tests__/          Vitest 测试
├── migrations/             D1 数据库迁移
├── public/                 静态资源（图标、logo、manifest）
├── scripts/                构建与发布脚本
├── sdk/                    官方 SDK（typescript / python）
├── browser-extensions/     Chrome / Firefox 扩展
├── docs/                   本文档站点 (VitePress)
└── wrangler.jsonc          Cloudflare Worker 配置
```

## 分层设计

应用大致分为三层：

### API / 页面层

- `src/api/`：公开的 Bearer Token API，基于 [Hono](https://hono.dev/) 与 `@hono/zod-openapi`。`router.ts` 挂载 `links`、`slugs` 两个子应用，并暴露 `/openapi.json` 与 `/docs`。
- `src/pages/`：服务端渲染的管理 UI 页面（仪表盘、链接、链接详情、API Keys、设置、重定向、自定义页面）。
- `src/components/`：管理 UI 共享组件（KPI 卡片、大图表、稀疏折线图、范围选择器等）。

### 服务层 (`src/services/`)

封装业务逻辑，独立于传输层：

| 模块 | 职责 |
|---|---|
| `link-management.ts` | 链接创建、更新、启用/禁用、删除 |
| `admin-management.ts` | 管理端操作 |
| `analytics.ts` | 点击分析聚合 |
| `trends.ts` | 趋势与环比计算 |
| `result.ts` | 统一的结果/错误封装 |

### 数据层 (`src/db/`)

对 D1 数据库的仓储 (repository) 封装：

| 仓储 | 表 |
|---|---|
| `link-repository.ts` | 链接 |
| `slug-repository.ts` | 短码 |
| `click-repository.ts` | 点击事件 |
| `api-key-repository.ts` | API 密钥 |
| `setting-repository.ts` | 每用户设置 |
| `page-repository.ts` | 自定义页面 |
| `filters.ts` | 分析过滤（机器人 / 自引用 / 时间范围）子查询 |

KV 层 (`src/kv/slug-cache.ts`) 为短码到链接的查找提供高速缓存。

## MCP (`src/mcp/`)

- `server.ts`：注册所有 MCP 工具（链接、短码、QR、分析），是工具列表的权威来源。
- `page.ts`：MCP 相关页面。

MCP 会话由 `wrangler.jsonc` 中声明的 Durable Object `MCP_OBJECT`（类 `ShrtnrMCP`）承载。

## 国际化 (`src/i18n/`)

所有管理页面/组件中面向用户的字符串都经由 `t()` 处理，翻译存放于 `en.ts`、`id.ts`、`sv.ts`。英语是唯一事实来源与回退。

## 相关文件

- [贡献指南](/zh/contributing/guidelines) 与 [发布流程](/zh/contributing/releases)：贡献约定、发布流程、SDK 一致性规则。
- [`wrangler.jsonc`](https://github.com/wyf9/shrtnr/blob/main/wrangler.jsonc)：Worker 绑定配置。
