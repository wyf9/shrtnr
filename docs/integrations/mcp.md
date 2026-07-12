# MCP Server (AI Integration)

Every shrtnr deployment includes a built-in [MCP](https://modelcontextprotocol.io/) endpoint. Claude, GitHub Copilot, Cursor, and any MCP-compatible client can connect over Streamable HTTP transport to create and manage short links.

The MCP endpoint authenticates through [Cloudflare Access Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/). CF Access acts as the OAuth authorization server: it handles client registration, token issuance, and validation at the edge. The Worker receives authenticated requests with identity headers and does not implement any OAuth endpoints itself.

::: warning Authorization model
The MCP endpoint does **not** split read from write today. Anyone whose email matches the CF Access policy on the MCP application can call every registered tool, including destructive ones (`delete_link`, `delete_bundle`, `remove_slug`, `archive_bundle`). Per-resource ownership still applies: a user cannot mutate another user's links or bundles. To grant a read-only audience, gate them through a separate MCP application or a separate Worker deployment with the write tools removed.
:::

## Setup

### 1. Create a self-hosted Access application for the MCP endpoint

CF Access MCP-type applications cannot be scoped to a path: they must own a full subdomain. The Worker detects requests on any host starting with `mcp.` and routes them to the MCP handler, so the subdomain **must** use the `mcp.` prefix (e.g., `mcp.your-domain.com`).

1. Go to **Access > Applications > Add an application > Self-hosted**.
2. Set the domain to your MCP subdomain (e.g., `mcp.your-domain.com`) with no path.
3. Add an allow policy for your email domain.
4. Go to **Advanced settings**, expand **Managed OAuth (Beta)** and toggle it **on**.
5. Enable **Allow localhost clients** and **Allow loopback clients**.
6. Under **Allowed redirect URIs**, add one entry per integration:
   - `https://claude.ai/api/mcp/auth_callback`: for Claude.ai (legacy domain) and Claude Desktop
   - `https://claude.com/api/mcp/auth_callback`: for Claude.ai (current domain)
   - `https://dash.cloudflare.com/*`: for the CF Access AI Controls portal to authenticate and sync tools
   - Add equivalents for other platforms (ChatGPT, etc.) as needed. To find a client's exact callback URI: attempt to connect, let the flow fail, and read the `redirect_uri` from the error URL in the browser.
7. CF Access changes can take 30–60 seconds to propagate after saving.

### Register custom domains with the Worker

The Worker needs two custom domains: one for the app itself (short link redirects, admin dashboard) and one for the MCP endpoint. CF Access MCP applications require their own subdomain and cannot share a domain with a path, so the MCP domain uses a `mcp.` prefix: `mcp.<your-domain>`.

Add both domains in the Cloudflare dashboard:

1. Go to **Workers & Pages** > shrtnr > **Settings** > **Domains & Routes**.
2. Click **Add Custom Domain** and enter your app domain (e.g., `your-domain.com`).
3. Click **Add Custom Domain** again and enter the MCP subdomain (e.g., `mcp.your-domain.com`).
4. Cloudflare creates the DNS records automatically for both; no manual DNS configuration needed.

### 2. Set Worker secrets and deploy

```bash
bunx wrangler secret put MCP_ACCESS_AUD    # AUD tag from the MCP Access application
bunx wrangler secret put ACCESS_JWKS_URL   # https://<your-team>.cloudflareaccess.com/cdn-cgi/access/certs
bun run deploy
```

### 3. Disable "Block AI bots" for your domain

Cloudflare's managed bot rule blocks requests from AI assistants (Claude, Copilot, etc.) at the edge before they reach your Worker. MCP clients connect from cloud infrastructure that Cloudflare classifies as AI bot traffic. If this rule is active, the OAuth handshake completes but the MCP connection itself is silently dropped.

Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > your zone > **Security** > filter by **Bot traffic** > find **Block AI bots** and set it to **Do not block (off)**. This must be disabled on every zone that hosts an MCP subdomain.

## Available tools

The MCP server registers tools for managing links, custom slugs, bundles, QR codes, and analytics (lifetime, time-ranged, and dimensional breakdowns). Connected clients discover the full list via the standard MCP `tools/list` call.

::: tip Authoritative source
The tool list changes with each release. Do not hardcode dynamic content that can drift; the authoritative source is [`src/mcp/server.ts`](https://github.com/wyf9/shrtnr/blob/main/src/mcp/server.ts).
:::

## Connecting MCP clients

All clients connect to `https://mcp.your-domain.com`. The OAuth handshake is automatic: the client opens a browser for Cloudflare Access sign-in on first connect.

**Claude (claude.ai):** Settings > Integrations > Add custom connector. Enter `https://mcp.your-domain.com` as the URL.

**Claude Desktop** (`claude_desktop_config.json`):

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

**Claude Code** (`.mcp.json`):

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

**VS Code / GitHub Copilot** (`.vscode/mcp.json`):

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

**Other clients:** Point at `https://mcp.your-domain.com` with Streamable HTTP transport. The server advertises its OAuth endpoints via `/.well-known/oauth-authorization-server`.

Replace `your-domain.com` with your actual short domain.

## Related resources

- [Model Context Protocol](https://modelcontextprotocol.io/): the MCP specification
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/): zero-trust access control
- [Cloudflare Access Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/): protecting MCP servers with Access
- [Cloudflare MCP Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/): the AI Controls portal for managing MCP servers in Zero Trust
