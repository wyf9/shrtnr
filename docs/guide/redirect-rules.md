# 动态重定向规则

如果你正在从 Cloudflare Pages 的 `_redirects` 迁移，可以在管理 UI 的 **Settings** 中打开 **Dynamic Redirect Rules**，把你的规则粘贴进去。

## 语法

- 每行一条规则：`<source> <destination> [status]`
- source 与 destination 中可用 `:placeholder`（例如 `:name`、`:task`）
- source 中可用 `*` 通配符（仅限最后一段），在 destination 中以 `:splat` 引用
- 可选状态码：`301`、`302`、`303`、`307`、`308`（默认 `302`）
- 以 `#` 开头的行是注释

## 示例

```txt
# 邮件重定向
/t/m/:name https://siiway.org/go/mail?name=:name
/t/m/:name/:domain https://siiway.org/go/mail?name=:name&domain=:domain
/mail/:email https://siiway.org/go/mail?email=:email
/m64/:base64 https://siiway.org/go/mail?base64=:base64

# 路径别名
/a/* https://siiway.org/about/:splat
/m/* https://siiway.org/zh/members/:splat
```

## 匹配顺序

规则在**未命中的公开路径**上运行，且发生在单段短码回退**之前**，因此已有的短链会继续正常工作。

匹配流程大致如下：

1. 请求命中某个已存在的短码 → 直接重定向。
2. 未命中短码 → 尝试动态重定向规则（按定义顺序）。
3. 仍未匹配 → 回退到单段短码逻辑 / 404。

相关实现见 `src/redirect-rules.ts` 与 `src/redirect.ts`。
