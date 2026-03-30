# shrtnr MCP Server

An [MCP](https://modelcontextprotocol.io) server that gives AI assistants access to your [shrtnr](https://github.com/oddbit/shrtnr) URL shortener instance.

## Requirements

- Node.js 18 or later
- A running shrtnr instance
- An API key with the appropriate scope (`create`, `read`, or both)

## Installation

Run directly with `npx` — no install needed:

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
| `SHRTNR_BASE_URL` | Yes | Base URL of your shrtnr instance, e.g. `https://example.com` |
| `SHRTNR_API_KEY` | Yes | API key from the shrtnr admin dashboard |

## Usage

### Claude Desktop

Add this block to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "shrtnr": {
      "command": "npx",
      "args": ["-y", "@oddbit/shrtnr-mcp"],
      "env": {
        "SHRTNR_BASE_URL": "https://s.example.com",
        "SHRTNR_API_KEY": "your-api-key"
      }
    }
  }
}
```

The config file is at:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### VS Code (GitHub Copilot)

Add this to your `.vscode/mcp.json` or user settings:

```json
{
  "servers": {
    "shrtnr": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@oddbit/shrtnr-mcp"],
      "env": {
        "SHRTNR_BASE_URL": "https://s.example.com",
        "SHRTNR_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|---|---|
| `health` | Check server health and version |
| `list_links` | List all short links |
| `get_link` | Get a link by ID |
| `create_link` | Shorten a URL |
| `update_link` | Update a link's URL, label, or expiry |
| `disable_link` | Disable a link so it stops redirecting |
| `add_vanity_slug` | Add a custom slug to a link |
| `get_link_analytics` | Get click analytics for a link |

## License

Apache-2.0 — see the root [LICENSE](../LICENSE) file.
