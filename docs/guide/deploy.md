# 部署

shrtnr 运行在 Cloudflare Workers + D1 上。你可以选择一键部署，或手动通过命令行部署。

::: tip 包管理器
本项目使用 [Bun](https://bun.sh/) 作为包管理器。下文命令均以 `bun` 为准。你也可以使用 `npx wrangler` 直接调用 Wrangler CLI。
:::

## 前置条件

- 一个 [Cloudflare 账号](https://dash.cloudflare.com/sign-up)（免费额度即可）。
- 已安装 [Bun](https://bun.sh/)（`node >= 22`）。
- 一个域名（可选，但推荐用于生产环境）。

## 一键部署

点击仓库 README 中的 **Deploy to Cloudflare** 按钮。Cloudflare 会 Fork 仓库、置备 D1 数据库与 KV 命名空间，并部署 Worker。

::: warning 重要：一键部署不会复制 GitHub Actions 工作流
当 Cloudflare Fork 你的仓库时，`.github/workflows/` 下的工作流**不会被复制**。这意味着自动迁移工作流 (`.github/workflows/migrate.yml`) 在你的 Fork 中并不存在。若不执行迁移，数据库表结构会缺失，应用将无法工作。
:::

首次部署后，立即应用数据库迁移：

```bash
cd shrtnr
bun install
bunx wrangler d1 migrations apply DB --remote
```

之后每次拉取更新并推送到你的 Fork 时，都要重新执行迁移，以应用新的表结构变更：

```bash
bunx wrangler d1 migrations apply DB --remote
```

若要自动化，可将上游仓库的 `.github/workflows/migrate.yml` 复制到你的 Fork，并添加所需 Secrets（见下方 [持续部署](#持续部署)）。

## 手动部署

```bash
git clone https://github.com/wyf9/shrtnr
cd shrtnr
bun install
bun run wrangler-login   # 或 bunx wrangler login
bun run db:create        # 创建 D1 数据库 shrtnr-db
bun run deploy           # 部署 Worker
bun run db:migrate:remote  # 对远程数据库应用迁移
```

对应的 npm scripts 定义在 `package.json` 中：

| 脚本 | 命令 |
|---|---|
| `dev` | `wrangler dev` |
| `deploy` | `wrangler deploy` |
| `wrangler-login` | `wrangler login` |
| `db:create` | `wrangler d1 create shrtnr-db` |
| `db:migrate:local` | `wrangler d1 migrations apply DB --local` |
| `db:migrate:remote` | `wrangler d1 migrations apply DB --remote` |
| `secret:put` | `wrangler secret put` |

## 绑定与配置

Worker 的绑定定义在 `wrangler.jsonc` 中：

- **D1 数据库**：绑定名 `DB`，数据库名 `shrtnr-db`，迁移目录 `migrations/`。
- **KV 命名空间**：绑定名 `SLUG_KV`，用于短码到链接的高速查找。
- **Durable Object**：`MCP_OBJECT`（类 `ShrtnrMCP`），承载 MCP agent 会话。
- **静态资源**：`public/` 目录作为静态资源提供。

> KV 命名空间 ID 在部署时由 `scripts/resolve-bindings.sh` 解析。

## 持续部署

Cloudflare [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) 会在每次推送生产分支时重新部署 Worker。数据库迁移由独立的 GitHub Actions 工作流 `.github/workflows/migrate.yml` 处理，它在 Cloudflare 的检查套件成功完成后触发。

**如果你使用一键部署**：Cloudflare Fork 仓库时不会复制 GitHub Actions 工作流。要获得自动迁移能力，请手动创建该文件：

1. 在你的 Fork 中创建 `.github/workflows/migrate.yml`，内容取自[上游仓库](https://github.com/oddbit/shrtnr/blob/main/.github/workflows/migrate.yml)。
2. 在 GitHub 的 **Settings > Secrets and variables > Actions** 中添加两个仓库 Secret：

- `CLOUDFLARE_API_TOKEN`：具备 **Workers Scripts: Edit** 与 **D1: Edit** 权限的 Cloudflare API Token。
- `CLOUDFLARE_ACCOUNT_ID`：你的 Cloudflare 账号 ID（在仪表盘 URL 或任意 zone 页面右侧栏可见）。

没有这些 Secret 你依然可以部署：Workers Builds 负责代码部署，而在推送表结构变更时你手动执行 `bun run db:migrate:remote` 即可。

## 下一步

部署完成后，管理 UI 默认**没有内置认证**。请务必先阅读 [访问控制](/guide/access-control) 来保护它。
