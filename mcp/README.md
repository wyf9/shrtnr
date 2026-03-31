# shrtnr MCP Server: AI-Powered URL Shortening

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets AI assistants shorten URLs, manage links, and read click analytics from your [shrtnr](https://github.com/oddbit/shrtnr) instance.

Works with Claude Desktop, Claude Code, VS Code (GitHub Copilot), Cursor, Windsurf, and any MCP-compatible client.

## What This Enables

Once configured, your AI assistant can:

- **Shorten URLs** during conversation, without switching to a browser
- **Look up short links** and their click stats
- **Create vanity slugs** like `/launch` or `/pricing` for campaigns
- **Read click analytics** broken down by country, device, browser, and referrer
- **Disable links** when a campaign ends

All through natural language. Ask "shorten this URL" or "how many clicks did my launch link get" and the assistant handles it.

## Requirements

- Node.js 18+
- A running shrtnr instance
- An API key with the appropriate scope (`create`, `read`, or both). Generate one from the shrtnr admin UI under API Keys.

## Installation

Run directly with `npx` (no install needed):

```bash
npx -y @oddbit/shrtnr-mcp
```

Or install globally:

```bash
npm install -g @oddbit/shrtnr-mcp
```

## Configuration

The server reads two environment variables:

| Variable | Required | Description |
|---|---|---|
| `SHRTNR_BASE_URL` | Yes | Base URL of your shrtnr instance (e.g. `https://s.example.com`) |
| `SHRTNR_API_KEY` | Yes | API key from the shrtnr admin UI |

## Setup by Client

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shrtnr": {
      "command": "npx",
      "args": ["-y", "@oddbit/shrtnr-mcp"],
      "env": {
        "SHRTNR_BASE_URL": "https://s.example.com",
        "SHRTNR_API_KEY": "sk_your_api_key"
      }
    }
  }
}
```

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code

Add to your project's `.mcp.json` or global settings:

```json
{
  "mcpServers": {
    "shrtnr": {
      "command": "npx",
      "args": ["-y", "@oddbit/shrtnr-mcp"],
      "env": {
        "SHRTNR_BASE_URL": "https://s.example.com",
        "SHRTNR_API_KEY": "sk_your_api_key"
      }
    }
  }
}
```

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` or user settings:

```json
{
  "servers": {
    "shrtnr": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@oddbit/shrtnr-mcp"],
      "env": {
        "SHRTNR_BASE_URL": "https://s.example.com",
        "SHRTNR_API_KEY": "sk_your_api_key"
      }
    }
  }
}
```

### Cursor / Windsurf

Both follow the same MCP configuration format as VS Code. Add the server block to your editor's MCP settings.

## Available Tools

| Tool | Scope | What it does |
|---|---|---|
| `health` | — | Check server health and version |
| `list_links` | read | List all short links |
| `get_link` | read | Get a link by ID with click stats |
| `create_link` | create | Shorten a URL |
| `update_link` | create | Change a link's URL, label, or expiry |
| `disable_link` | create | Disable a link so it stops redirecting |
| `add_vanity_slug` | create | Add a custom slug like `/launch` to a link |
| `get_link_analytics` | read | Get click breakdown by country, device, browser, referrer |

## License

Apache-2.0. See the root [LICENSE](../LICENSE) file.
