// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShrtnrHttpClient, ShrtnrApiError } from "./client.ts";

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(err: unknown) {
  const text =
    err instanceof ShrtnrApiError
      ? `[${err.status}] ${err.message}`
      : String(err);
  return { content: [{ type: "text" as const, text }], isError: true };
}

export function createMcpServer(client: ShrtnrHttpClient, version: string): McpServer {
  const server = new McpServer({ name: "shrtnr", version });

  server.tool(
    "health",
    "Check the shrtnr server health and current version",
    {},
    async () => {
      try { return ok(await client.health()); }
      catch (e) { return fail(e); }
    },
  );

  server.tool(
    "list_links",
    "List all short links with their slugs and click counts",
    {},
    async () => {
      try { return ok(await client.listLinks()); }
      catch (e) { return fail(e); }
    },
  );

  server.tool(
    "get_link",
    "Get full details for a short link by its numeric ID",
    {
      link_id: z.number().int().positive().describe("Numeric ID of the link"),
    },
    async ({ link_id }) => {
      try { return ok(await client.getLink(link_id)); }
      catch (e) { return fail(e); }
    },
  );

  server.tool(
    "create_link",
    "Shorten a URL and create a new short link",
    {
      url: z.string().url().describe("Destination URL to shorten"),
      label: z.string().optional().describe("Human-readable label for the link"),
      slug_length: z.number().int().min(3).optional().describe("Length of the random slug (default: 3)"),
      vanity_slug: z.string().optional().describe("Custom slug, e.g. 'my-blog-post'"),
      expires_at: z.number().int().optional().describe("Unix timestamp when the link expires"),
    },
    async (opts) => {
      try { return ok(await client.createLink(opts)); }
      catch (e) { return fail(e); }
    },
  );

  server.tool(
    "update_link",
    "Update the destination URL, label, or expiry of an existing short link",
    {
      link_id: z.number().int().positive().describe("Numeric ID of the link to update"),
      url: z.string().url().optional().describe("New destination URL"),
      label: z.string().nullable().optional().describe("New label (null removes it)"),
      expires_at: z.number().int().nullable().optional().describe("New expiry Unix timestamp (null removes it)"),
    },
    async ({ link_id, ...opts }) => {
      try { return ok(await client.updateLink(link_id, opts)); }
      catch (e) { return fail(e); }
    },
  );

  server.tool(
    "disable_link",
    "Disable a short link so it stops redirecting",
    {
      link_id: z.number().int().positive().describe("Numeric ID of the link to disable"),
    },
    async ({ link_id }) => {
      try { return ok(await client.disableLink(link_id)); }
      catch (e) { return fail(e); }
    },
  );

  server.tool(
    "add_vanity_slug",
    "Add a custom vanity slug to an existing link",
    {
      link_id: z.number().int().positive().describe("Numeric ID of the link"),
      slug: z.string().min(1).describe("Custom slug to add, e.g. 'my-post'"),
    },
    async ({ link_id, slug }) => {
      try { return ok(await client.addVanitySlug(link_id, slug)); }
      catch (e) { return fail(e); }
    },
  );

  server.tool(
    "get_link_analytics",
    "Get click analytics for a short link: countries, referrers, devices, browsers, and daily click history",
    {
      link_id: z.number().int().positive().describe("Numeric ID of the link"),
    },
    async ({ link_id }) => {
      try { return ok(await client.getLinkAnalytics(link_id)); }
      catch (e) { return fail(e); }
    },
  );

  return server;
}
