#!/usr/bin/env node
// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ShrtnrHttpClient } from "./client.ts";
import { createMcpServer } from "./server.ts";
import packageJson from "../package.json" with { type: "json" };

const baseUrl = process.env.SHRTNR_BASE_URL;
const apiKey = process.env.SHRTNR_API_KEY;

if (!baseUrl) {
  process.stderr.write("Error: SHRTNR_BASE_URL environment variable is required\n");
  process.exit(1);
}

if (!apiKey) {
  process.stderr.write("Error: SHRTNR_API_KEY environment variable is required\n");
  process.exit(1);
}

const client = new ShrtnrHttpClient(baseUrl, apiKey);
const server = createMcpServer(client, packageJson.version);
const transport = new StdioServerTransport();

await server.connect(transport);
