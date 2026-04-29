// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("OpenAPI surface", () => {
  it("GET /_/api/openapi.json returns a valid OpenAPI 3.1 document", async () => {
    const res = await SELF.fetch("https://shrtnr.test/_/api/openapi.json");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type") ?? "").toMatch(/application\/json/);
    const doc = await res.json() as { openapi: string; info: { title: string; version: string }; paths: Record<string, unknown> };
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBe("shrtnr API");
    expect(doc.info.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(typeof doc.paths).toBe("object");
  });

  it("GET /_/api/docs returns HTML referencing the spec endpoint", async () => {
    const res = await SELF.fetch("https://shrtnr.test/_/api/docs");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type") ?? "").toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("/_/api/openapi.json");
  });
});
