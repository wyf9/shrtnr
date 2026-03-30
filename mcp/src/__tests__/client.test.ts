// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ShrtnrHttpClient, ShrtnrApiError } from "../client.ts";

const BASE_URL = "https://shrtnr.example.com";
const API_KEY = "sk_test_abc123";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("ShrtnrHttpClient", () => {
  let client: ShrtnrHttpClient;

  beforeEach(() => {
    client = new ShrtnrHttpClient(BASE_URL, API_KEY);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("constructor", () => {
    it("strips trailing slashes from base URL", async () => {
      const c = new ShrtnrHttpClient("https://example.com///", API_KEY);
      vi.stubGlobal("fetch", mockFetch(200, { status: "ok", version: "1.0.0", timestamp: 0 }));
      await c.health();
      expect(vi.mocked(fetch).mock.calls[0][0]).toBe("https://example.com/_/health");
    });

    it("sets Authorization header from API key", async () => {
      vi.stubGlobal("fetch", mockFetch(200, { status: "ok", version: "1.0.0", timestamp: 0 }));
      await client.health();
      const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
      expect((init.headers as Record<string, string>)["Authorization"]).toBe(`Bearer ${API_KEY}`);
    });
  });

  describe("health()", () => {
    it("calls GET /_/health and returns the body", async () => {
      const body = { status: "ok", version: "0.2.0", timestamp: 1700000000 };
      vi.stubGlobal("fetch", mockFetch(200, body));
      const result = await client.health();
      expect(result).toEqual(body);
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/_/health`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("listLinks()", () => {
    it("calls GET /_/api/links and returns an array", async () => {
      const body = [{ id: 1, url: "https://example.com", slugs: [], total_clicks: 0 }];
      vi.stubGlobal("fetch", mockFetch(200, body));
      const result = await client.listLinks();
      expect(result).toEqual(body);
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/_/api/links`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("getLink()", () => {
    it("calls GET /_/api/links/:id", async () => {
      const body = { id: 42, url: "https://example.com", slugs: [], total_clicks: 5 };
      vi.stubGlobal("fetch", mockFetch(200, body));
      const result = await client.getLink(42);
      expect(result).toEqual(body);
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/_/api/links/42`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("createLink()", () => {
    it("calls POST /_/api/links with the serialized options", async () => {
      const body = { id: 10, url: "https://example.com/long", slugs: [{ slug: "abc" }], total_clicks: 0 };
      vi.stubGlobal("fetch", mockFetch(201, body));
      const opts = { url: "https://example.com/long", label: "My post", slug_length: 4 };
      const result = await client.createLink(opts);
      expect(result).toEqual(body);
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/_/api/links`);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(init?.body as string)).toEqual(opts);
    });
  });

  describe("updateLink()", () => {
    it("calls PUT /_/api/links/:id with the options body", async () => {
      const body = { id: 7, url: "https://new-dest.com", slugs: [], total_clicks: 3 };
      vi.stubGlobal("fetch", mockFetch(200, body));
      const opts = { url: "https://new-dest.com", label: null };
      const result = await client.updateLink(7, opts);
      expect(result).toEqual(body);
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/_/api/links/7`);
      expect(init?.method).toBe("PUT");
      expect(JSON.parse(init?.body as string)).toEqual(opts);
    });
  });

  describe("disableLink()", () => {
    it("calls POST /_/api/links/:id/disable", async () => {
      const body = { id: 3, url: "https://example.com", expires_at: 1000, slugs: [], total_clicks: 1 };
      vi.stubGlobal("fetch", mockFetch(200, body));
      await client.disableLink(3);
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/_/api/links/3/disable`,
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("addVanitySlug()", () => {
    it("calls POST /_/api/links/:id/slugs with the slug body", async () => {
      const body = { id: 1, link_id: 5, slug: "my-post", is_vanity: 1, click_count: 0, created_at: 0 };
      vi.stubGlobal("fetch", mockFetch(201, body));
      const result = await client.addVanitySlug(5, "my-post");
      expect(result).toEqual(body);
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe(`${BASE_URL}/_/api/links/5/slugs`);
      expect(init?.method).toBe("POST");
      expect(JSON.parse(init?.body as string)).toEqual({ slug: "my-post" });
    });
  });

  describe("getLinkAnalytics()", () => {
    it("calls GET /_/api/links/:id/analytics", async () => {
      const body = { total_clicks: 42, countries: [], referrers: [], devices: [], browsers: [], clicks_over_time: [] };
      vi.stubGlobal("fetch", mockFetch(200, body));
      const result = await client.getLinkAnalytics(9);
      expect(result).toEqual(body);
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/_/api/links/9/analytics`,
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("error handling", () => {
    it("throws ShrtnrApiError on a non-2xx response, with status and message from body", async () => {
      vi.stubGlobal("fetch", mockFetch(404, { error: "Link not found" }));
      await expect(client.getLink(999)).rejects.toMatchObject({
        name: "ShrtnrApiError",
        status: 404,
        message: "Link not found",
      });
    });

    it("throws ShrtnrApiError with generic HTTP message when body has no error field", async () => {
      vi.stubGlobal("fetch", mockFetch(500, { unexpected: true }));
      await expect(client.health()).rejects.toMatchObject({
        name: "ShrtnrApiError",
        status: 500,
        message: "HTTP 500",
      });
    });

    it("ShrtnrApiError is an instance of Error", async () => {
      vi.stubGlobal("fetch", mockFetch(401, { error: "Unauthorized" }));
      await expect(client.listLinks()).rejects.toBeInstanceOf(Error);
    });
  });
});
