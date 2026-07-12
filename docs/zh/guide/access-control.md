# 访问控制

管理 UI (`/_/admin/*`) 出厂时**不带内置认证**。保护它是你的责任。应用不对你使用的认证方式做任何假设，但我们推荐在多数部署中使用 [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/)。其他选项包括 IP 白名单、防火墙规则、Cloudflare Tunnel，或运行在私有网络中。

::: danger 请勿跳过这一步
未受保护的管理 UI 意味着任何知道地址的人都能管理你的链接。部署后请立即配置访问控制。
:::

## 推荐：Cloudflare Access

Cloudflare Access 在请求到达 Worker 之前，就在边缘处理登录、会话和 SSO。它支持 Google、GitHub、Microsoft、Okta、SAML、OIDC，以及内置的一次性 PIN。

1. 在 [Cloudflare 仪表盘](https://one.dash.cloudflare.com/)中打开 **Zero Trust**。
2. 进入 **Access > Applications > Add an application**。
3. 选择 **Self-hosted**。
4. 将应用域名设置为你的短域名（如 `oddb.it`），路径为 `_/admin/*`。
5. 添加一条策略，例如：
   - **Action:** Allow
   - **Include rule:** 邮箱以 `@yourcompany.com` 结尾
6. 在 **Authentication** 下，至少启用一种登录方式。"One-time PIN" 无需外部 IdP 即可开箱即用。

访问 `https://yourdomain.com` 时，Cloudflare Access 会在你到达管理面板前提示登录。IdP 配置见 [Cloudflare 的 IdP 指南](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/)。

## 在 Worker 中启用 JWT 校验

默认情况下，Worker 信任 Cloudflare Access 放行的任何请求（网络层保护）。为实现纵深防御，可启用加密级别的 JWT 校验，让 Worker 独立验证每个请求：

1. 在 Zero Trust 中，进入应用的 **Overview** 标签页，复制 **Application Audience (AUD) Tag**。
2. 将其设置为 Worker Secret：

```bash
bunx wrangler secret put ACCESS_AUD
bunx wrangler secret put ACCESS_JWKS_URL
```

`ACCESS_JWKS_URL` 遵循以下格式：

```
https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/certs
```

当 `ACCESS_AUD` 已设置时，Worker 会在每个管理与 MCP 请求上校验 JWT 签名和 audience 声明。当未设置时（本地开发），它会跳过校验并回退到开发模式。

## 相关 Worker Secret

| Secret | 用途 |
|---|---|
| `ACCESS_AUD` | 管理应用的 AUD Tag，启用管理请求的 JWT 校验 |
| `ACCESS_JWKS_URL` | Cloudflare Access 的 JWKS 证书地址 |
| `MCP_ACCESS_AUD` | MCP Access 应用的 AUD Tag，见 [MCP 服务器](/zh/integrations/mcp) |

相关实现见 `src/access.ts` 与 `src/auth.ts`。
