# Changelog

All notable changes to the MCP server are documented in this file.

## 0.1.4

- Config fix

## 0.1.2

- Fixed HTTP client error handling: check response status before parsing JSON body to avoid confusing parse errors on non-JSON error responses

## 0.1.1

- Updating documentation.

## 0.1.0

Initial release. MCP server exposing shrtnr link management to AI assistants via the Model Context Protocol (stdio transport).

Tools: `health`, `list_links`, `get_link`, `create_link`, `update_link`, `disable_link`, `add_vanity_slug`, `get_link_analytics`.
