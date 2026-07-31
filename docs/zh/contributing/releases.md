# 发布流程

本仓库有三条独立的发布轨道：Cloudflare Workers 应用与两套 SDK。每条轨道都由 `main` 上的版本号变更驱动，并各自拥有独立的 GitHub Actions 工作流。

## 发布轨道

| 目标 | 清单文件 | Tag 前缀 | 工作流 | 模式 |
|---|---|---|---|---|
| Cloudflare Workers 应用 | 根 `package.json` | `app-v*` | `release.yml` | main-push |
| TypeScript / npm SDK | `sdk/typescript/package.json` | `npm-v*` | `release-sdk-npm.yml` | main-push |
| Python / PyPI SDK | `sdk/python/pyproject.toml` | `py-v*` | `release-sdk-python.yml` | main-push |


共享的 bash 逻辑位于 `scripts/read-version.sh` 与 `scripts/extract-changelog.sh`，被各工作流调用。

## 版本号变更

使用 `scripts/bump-sdk-version.sh <npm|python> <version>`：

```bash
scripts/bump-sdk-version.sh npm 0.7.3
scripts/bump-sdk-version.sh python 0.1.1
```

该脚本会编辑对应的清单文件，向匹配的 `CHANGELOG.md` 前置一个 `## X.Y.Z` 占位小节，并刷新锁文件。它不会提交、打 tag 或推送。提交前请把 `TODO: fill in release notes.` 替换为真实发布说明。

当收到"更新版本" / "bump version" / "创建发布"的指令时：

1. 按语义化版本在正确的清单文件中变更版本号。若不明确，先确认轨道。
2. 向匹配的 `CHANGELOG.md` 添加一个简洁小节。
3. 仅应用轨道：运行 `./scripts/spec-hash.sh`，并在同一提交中更新所有 SDK 的 spec 哈希。
4. 提交。不要推送。

## Spec 哈希

每个 SDK 都记录它最后一次针对的 OpenAPI 规范的 SHA-256：

| SDK | 清单文件 | 字段 |
|---|---|---|
| TypeScript | `sdk/typescript/package.json` | 顶层 `x-spec-hash` |
| Python | `sdk/python/pyproject.toml` | `[tool.shrtnr]` 下的 `spec_hash` |


规范变更会使两个哈希全部过期。根 `package.json` 的版本号变更也会导致哈希漂移，因为规范内嵌了 `info.version`。

API 变更时的流程：

1. 提交 API 变更。运行 `./scripts/spec-hash.sh` 获取新哈希。
2. 对每个 SDK，判断该变更是表层的还是内部的。
3. 在变更任何哈希前运行一致性检查。
4. 每个 SDK 单独提交，提交信息聚焦。

### 一致性检查

- 模型覆盖每一个 `components.schemas` 条目。
- 端点以资源分组上的方法形式暴露。
- 参数与规范一致。
- 测试通过。
- 跨 SDK 一致性成立。

## 自动化原理

**main-push 模式（应用、npm、Python）**：工作流在任意触及该轨道清单路径的 `main` 推送时触发。它在触发的推送范围（`github.event.before..github.sha`）内比较清单文件，若未被触及则干净退出——因此即便版本号变更不在多提交推送的最后一个提交，也能被正确检测。若清单已变更，则执行安装 + 构建 + 测试，通过 OIDC 发布，然后创建 `<prefix>-v<version>` tag 与对应的 GitHub Release。幂等性有两层：上述推送范围检查，以及捕获重跑的 tag 存在性检查。

## 一次性的注册表配置

两个注册表都使用 OIDC 可信发布，任何地方都不存储长期令牌。

- **npm**：`@wyf9/shrtnr` 的包页面 → Settings → Trusted publishers。Publisher: GitHub Actions，仓库 `oddbit/shrtnr`，工作流 `release-sdk-npm.yml`。
- **PyPI**：<https://pypi.org/manage/account/publishing/> → 添加 pending publisher。项目 `wshrtnr`，owner `oddbit`，工作流 `release-sdk-python.yml`。

## 新增一套 SDK

1. 在 `sdk/<language>/` 下按现有布局约定添加。
2. 若新清单格式不是 JSON / YAML / TOML，则在 `scripts/read-version.sh` 中扩展一个分支。
3. 在 `scripts/bump-sdk-version.sh` 中扩展一个新的 `<sdk>` 标识。
4. 添加新工作流 `release-sdk-<name>.yml`，复制最接近的现有轨道（npm/Python 的 main-push），并替换清单路径、tag 前缀与发布步骤。
5. 记录一次性的可信发布方配置。
