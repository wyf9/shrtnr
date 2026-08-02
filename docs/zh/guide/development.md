# 本地开发

本项目使用 [Bun](https://bun.sh/) 作为包管理器，[Wrangler](https://developers.cloudflare.com/workers/wrangler/) 作为本地运行时，[Vitest](https://vitest.dev/) 运行测试。

## 环境要求

- [Bun](https://bun.sh/) 1.3+（`node >= 22`）
- 一个 Cloudflare 账号（用于远程部署，本地开发可不用）

## 启动

```bash
bun install
bun run db:migrate:local   # 对本地 D1 应用迁移
bun run test               # 运行测试
bun run dev                # 启动本地开发服务器 (wrangler dev)
```

`bun run dev` 会启动 `wrangler dev`，在本地模拟 Workers 运行时、D1、KV 与 Durable Objects。

::: tip 本地开发模式的认证
当 `ACCESS_AUD` 未设置时（本地开发默认如此），Worker 会跳过 JWT 校验并回退到开发模式，因此你可以直接访问管理 UI 而无需配置 Cloudflare Access。
:::

## 常用脚本

| 脚本                        | 说明                                       |
| --------------------------- | ------------------------------------------ |
| `bun run dev`               | 启动本地开发服务器                         |
| `bun run deploy`            | 部署到 Cloudflare                          |
| `bun run test`              | 运行一次测试 (`vitest run`)                |
| `bun run test:watch`        | 监听模式运行测试                           |
| `bun run db:migrate:local`  | 对本地 D1 应用迁移                         |
| `bun run db:migrate:remote` | 对远程 D1 应用迁移                         |
| `bun run emit-spec`         | 生成 OpenAPI 规范 (`scripts/emit-spec.ts`) |

## 测试

测试使用 [`@cloudflare/vitest-pool-workers`](https://developers.cloudflare.com/workers/testing/vitest-integration/)，在真实的 Workers 运行时中执行。配置见 `vitest.config.mts`，测试位于 `src/__tests__/`。

```bash
bun run test          # 单次运行
bun run test:watch    # 监听模式
```

::: warning 测试约定

- 为每个请求的行为或变更编写测试。
- 不要为了迁就代码改动而修改或删除测试。
  :::

## SDK 开发

SDK 位于 `sdk/` 下的独立目录中（`typescript/`、`python/`）：

```bash
cd sdk/typescript
bun install
bun run test
bun run build
```

::: tip SDK 一致性

- 对任一 SDK 的改动都需要评估并同步到其他 SDK。
- 所有 SDK 的 README 保持同步，仅按语言习惯做必要调整。
- 每个 SDK 记录其最后一次针对的 OpenAPI 规范的 SHA-256（spec hash）。API 变更会同时使两个哈希过期。
  :::

详细的贡献与发布约定见 [贡献指南](/zh/contributing/guidelines) 与 [发布流程](/zh/contributing/releases)。

## 文档开发

本文档站点使用 [VitePress](https://vitepress.dev/) 构建，源码位于 `docs/`：

```bash
bun run docs:dev       # 本地预览文档
bun run docs:build     # 构建静态站点
bun run docs:preview   # 预览构建产物
```
