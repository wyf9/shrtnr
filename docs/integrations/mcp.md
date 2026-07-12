# MCP 服务器（AI 集成）

每个 shrtnr 部署都内置一个 [MCP](https://modelcontextprotocol.io/) 端点。Claude、GitHub Copilot、Cursor 以及任何兼容 MCP 的客户端，都能通过 Streamable HTTP 传输连接它，来创建和管理短链。

MCP 端点通过 [Cloudflare Access Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/) 认证。CF Access 充当 OAuth 授权服务器：它在边缘处理客户端注册、令牌签发与校验。Worker 收到的是带身份头的已认证请求，自身不实现任何 OAuth 端点。

::: warning 授权模型
MCP 端点目前**不区分读写**。任何邮箱匹配 MCP 应用 CF Access 策略的用户，都可以调用每一个已注册工具，包括破坏性的工具（`delete_link`、`delete_bundle`、`remove_slug`、`archive_bundle`）。但按资源的归属限制仍然生效：用户无法修改他人的链接或分组。若要提供只读受众，请通过独立的 MCP 应用，或移除写工具的独立 Worker 部署来隔离。
:::

## 设置步骤

### 1. 为 MCP 端点创建自托管 Access 应用

CF Access 的 MCP 类型应用**不能**限定到某个路径：它们必须独占一个完整子域名。Worker 会检测任何以 `mcp.` 开头的主机并路由到 MCP 处理器，因此子域名**必须**使用 `mcp.` 前缀（例如 `mcp.your-domain.com`）。

1. 进入 **Access > Applications > Add an application > Self-hosted**。
2. 将域名设为你的 MCP 子域名（如 `mcp.your-domain.com`），不带路径。
3. 为你的邮箱域名添加一条 allow 策略。
4. 进入 **Advanced settings**，展开 **Managed OAuth (Beta)** 并**打开**开关。
5. 启用 **Allow localhost clients** 和 **Allow loopback clients**。
6. 在 **Allowed redirect URIs** 下，为每个集成各添加一条：
   - `https://claude.ai/api/mcp/auth_callback`：用于 Claude.ai（旧域名）和 Claude Desktop
   - `https://claude.com/api/mcp/auth_callback`：用于 Claude.ai（当前域名）
   - `https://dash.cloudflare.com/*`：用于 CF Access AI Controls 门户认证与同步工具
   - 按需为其他平台（ChatGPT 等）添加等价项。要查明某客户端的确切回调 URI：尝试连接、让流程失败，然后从浏览器错误 URL 中读取 `redirect_uri`。
7. CF Access 的变更在保存后可能需要 30–60 秒生效。

### 向 Worker 注册自定义域名

Worker 需要两个自定义域名：一个用于应用本身（短链重定向、管理面板），一个用于 MCP 端点。CF Access MCP 应用需要独立子域名，不能与路径共享域名，因此 MCP 域名使用 `mcp.` 前缀：`mcp.<your-domain>`。

在 Cloudflare 仪表盘中添加两个域名：

1. 进入 **Workers & Pages** > shrtnr > **Settings** > **Domains & Routes**。
2. 点击 **Add Custom Domain**，输入应用域名（如 `your-domain.com`）。
3. 再次点击 **Add Custom Domain**，输入 MCP 子域名（如 `mcp.your-domain.com`）。
4. Cloudflare 会自动为两者创建 DNS 记录，无需手动配置。

### 2. 设置 Worker Secret 并部署

```bash
bunx wrangler secret put MCP_ACCESS_AUD    # MCP Access 应用的 AUD Tag
bunx wrangler secret put ACCESS_JWKS_URL   # https://<your-team>.cloudflareaccess.com/cdn-cgi/access/certs
bun run deploy
```

### 3. 关闭域名的 "Block AI bots"

Cloudflare 的托管机器人规则会在请求到达 Worker 前，在边缘拦截来自 AI 助手（Claude、Copilot 等）的请求。MCP 客户端从云基础设施发起连接，会被 Cloudflare 归类为 AI 机器人流量。若此规则生效，OAuth 握手能完成，但 MCP 连接本身会被静默丢弃。

进入 [Cloudflare 仪表盘](https://dash.cloudflare.com/) > 你的 zone > **Security** > 按 **Bot traffic** 过滤 > 找到 **Block AI bots** 并设为 **Do not block (off)**。每个托管 MCP 子域名的 zone 都必须关闭此项。

## 可用工具

MCP 服务器注册了用于管理链接、自定义短码、分组、QR 码和分析（终身、时间范围、维度拆分）的工具。已连接的客户端通过标准 MCP `tools/list` 调用即可发现完整列表。

::: tip 权威来源
工具列表会随版本变化。请勿在文档中硬编码可能漂移的动态内容，权威来源是 [`src/mcp/server.ts`](https://github.com/wyf9/shrtnr/blob/main/src/mcp/server.ts)。
:::

## 连接 MCP 客户端

所有客户端都连接到 `https://mcp.your-domain.com`。OAuth 握手是自动的：客户端会在首次连接时打开浏览器进行 Cloudflare Access 登录。

**Claude (claude.ai)**：Settings > Integrations > Add custom connector，将 `https://mcp.your-domain.com` 作为 URL 输入。

**Claude Desktop** (`claude_desktop_config.json`)：

```json
{
  "mcpServers": {
    "shrtnr": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.your-domain.com"]
    }
  }
}
```

**Claude Code** (`.mcp.json`)：

```json
{
  "mcpServers": {
    "shrtnr": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.your-domain.com"]
    }
  }
}
```

**VS Code / GitHub Copilot** (`.vscode/mcp.json`)：

```json
{
  "servers": {
    "shrtnr": {
      "type": "http",
      "url": "https://mcp.your-domain.com"
    }
  }
}
```

**其他客户端**：指向 `https://mcp.your-domain.com`，使用 Streamable HTTP 传输。服务器通过 `/.well-known/oauth-authorization-server` 公布其 OAuth 端点。

请将 `your-domain.com` 替换为你实际的短域名。

## 相关资源

- [Model Context Protocol](https://modelcontextprotocol.io/)：MCP 规范
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)：零信任访问控制
- [Cloudflare Access Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/)：用 Access 保护 MCP 服务器
- [Cloudflare MCP Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)：在 Zero Trust 中管理 MCP 服务器的 AI Controls 门户
