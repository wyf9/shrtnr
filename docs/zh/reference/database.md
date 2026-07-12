# 数据库与迁移

shrtnr 使用 [Cloudflare D1](https://developers.cloudflare.com/d1/)（基于 SQLite）作为主数据库，配合 KV 命名空间做短码查找缓存。

## 绑定

数据库绑定在 `wrangler.jsonc` 中定义：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "shrtnr-db",
    "migrations_dir": "migrations",
    "database_id": "..."
  }
]
```

- 绑定名：`DB`
- 数据库名：`shrtnr-db`
- 迁移目录：`migrations/`

## 应用迁移

```bash
# 本地开发数据库
bun run db:migrate:local

# 远程（生产）数据库
bun run db:migrate:remote
```

底层等价于：

```bash
bunx wrangler d1 migrations apply DB --local
bunx wrangler d1 migrations apply DB --remote
```

::: warning 一键部署后必须迁移
Cloudflare 一键部署不会复制 GitHub Actions 工作流，因此不会自动迁移。首次部署后请立即执行 `bun run db:migrate:remote`，否则表结构缺失、应用无法工作。详见 [部署](/zh/guide/deploy)。
:::

## 迁移列表

迁移文件位于 `migrations/`，按序号命名并顺序应用：

| 文件 | 说明 |
|---|---|
| `0001_initial.sql` | 初始表结构（链接、短码等） |
| `0002_analytics_schema.sql` | 点击分析相关表 |
| `0003_drop_cached_counters.sql` | 移除缓存计数器 |
| `0004_slug_text_pk.sql` | 短码改为文本主键 |
| `0005_bundles.sql` | 分组 (Bundles) 支持（后已移除）与访客指纹列 |
| `0006_self_referrer_flag.sql` | 自引用来源标记 |
| `0007_redirect_settings.sql` | 动态重定向规则设置 |
| `0008_pages.sql` | 自定义页面 (Pages) 支持 |
| `0009_drop_bundles.sql` | 移除分组 (Bundles) 功能表结构 |

## 迁移约定

::: tip 数据安全
- 保留所有既有数据。
- 当重建被 `ON DELETE CASCADE` 外键引用的表时，先保存并删除依赖表，重命名后再恢复。
- 迁移后验证所有受影响表的行数不变。
:::

## KV 缓存

短码到链接的查找由 KV 命名空间 `SLUG_KV`（绑定于 `wrangler.jsonc`）加速，实现见 `src/kv/slug-cache.ts`。命名空间 ID 在部署时由 `scripts/resolve-bindings.sh` 解析。
