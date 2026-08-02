// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShrtnrClient } from "../src/index";
import { ShrtnrError } from "../src/index";

const BASE = "https://shrtnr.test";
const API_KEY = "sk_abc";

let fetchSpy: ReturnType<typeof vi.fn>;

function mockFetch(
  status: number,
  body: unknown,
  contentType = "application/json",
) {
  const bodyStr = contentType.startsWith("application/json")
    ? JSON.stringify(body)
    : String(body);
  fetchSpy.mockResolvedValueOnce(
    new Response(bodyStr, {
      status,
      headers: { "Content-Type": contentType },
    }),
  );
}

function client(): ShrtnrClient {
  return new ShrtnrClient({ baseUrl: BASE, apiKey: API_KEY, fetch: fetchSpy });
}

function lastCall(): { url: string; init: RequestInit } {
  const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
  return { url, init };
}

beforeEach(() => {
  fetchSpy = vi.fn();
});

// ============================================================
// 1. Auth headers
// ============================================================

describe("Auth headers", () => {
  it("sends Authorization: Bearer on every request", async () => {
    mockFetch(200, []);
    await client().links.list();
    const { init } = lastCall();
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Bearer ${API_KEY}`);
  });

  it("auth header appears on slug requests too", async () => {
    mockFetch(200, {
      linkId: 1,
      slug: "test",
      isCustom: 1,
      isPrimary: 1,
      clickCount: 0,
      createdAt: 0,
      disabledAt: null,
    });
    await client().slugs.lookup("test");
    const { init } = lastCall();
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      `Bearer ${API_KEY}`,
    );
  });
});

// ============================================================
// 2. Error handling
// ============================================================

describe("Error handling", () => {
  it("throws ShrtnrError on 404", async () => {
    mockFetch(404, { error: "Link not found" });
    await expect(client().links.get(999)).rejects.toBeInstanceOf(ShrtnrError);
  });

  it("populates status and serverMessage from error body", async () => {
    mockFetch(409, { error: "Slug already exists" });
    try {
      await client().slugs.add(1, "taken");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ShrtnrError);
      expect((e as ShrtnrError).status).toBe(409);
      expect((e as ShrtnrError).serverMessage).toBe("Slug already exists");
    }
  });

  it("formats the error message with HTTP status", async () => {
    mockFetch(400, { error: "bad request" });
    try {
      await client().links.get(1);
      expect.unreachable();
    } catch (e) {
      expect((e as ShrtnrError).message).toBe(
        "shrtnr API error (HTTP 400): bad request",
      );
    }
  });

  it("throws ShrtnrError on 401 unauthorized", async () => {
    mockFetch(401, { error: "Unauthorized" });
    await expect(client().links.list()).rejects.toBeInstanceOf(ShrtnrError);
  });

  it("wraps network errors in ShrtnrError with status 0", async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError("fetch failed"));
    try {
      await client().links.list();
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ShrtnrError);
      expect((e as ShrtnrError).status).toBe(0);
    }
  });
});

// ============================================================
// 3. Case transformation
// ============================================================

describe("Case transformation", () => {
  it("converts snake_case JSON keys to camelCase model fields", async () => {
    const wireLink = {
      id: 42,
      url: "https://example.com",
      label: "test",
      created_at: 1000,
      expires_at: null,
      created_via: null,
      created_by: "user@example.com",
      total_clicks: 5,
      delta_pct: 0.1,
      slugs: [
        {
          link_id: 42,
          slug: "abc",
          is_custom: 0,
          is_primary: 1,
          click_count: 5,
          created_at: 1000,
          disabled_at: null,
        },
      ],
    };
    mockFetch(200, wireLink);
    const link = await client().links.get(42);
    expect(link.createdAt).toBe(1000);
    expect(link.totalClicks).toBe(5);
    expect(link.deltaPct).toBe(0.1);
    expect(link.slugs[0].linkId).toBe(42);
    expect(link.slugs[0].isCustom).toBe(0);
    expect(link.slugs[0].isPrimary).toBe(1);
    expect(link.slugs[0].clickCount).toBe(5);
    expect(link.slugs[0].disabledAt).toBeNull();
  });

  it("converts camelCase request body keys to snake_case on the wire", async () => {
    mockFetch(201, {
      id: 1,
      url: "https://example.com",
      label: null,
      created_at: 1000,
      expires_at: null,
      created_via: null,
      created_by: "u",
      total_clicks: 0,
      slugs: [],
    });
    await client().links.create({
      url: "https://example.com",
      slugLength: 6,
      expiresAt: 2000,
    });
    const { init } = lastCall();
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body["slug_length"]).toBe(6);
    expect(body["expires_at"]).toBe(2000);
    expect(body["slugLength"]).toBeUndefined();
    expect(body["expiresAt"]).toBeUndefined();
  });
});

// ============================================================
// 4. LinksResource
// ============================================================

const stubLink = {
  id: 1,
  url: "https://example.com",
  label: null,
  created_at: 1000,
  expires_at: null,
  created_via: null,
  created_by: "u",
  total_clicks: 0,
  slugs: [],
};

describe("links.get", () => {
  it("GETs /api/links/:id", async () => {
    mockFetch(200, stubLink);
    await client().links.get(3);
    expect(lastCall().url).toBe(`${BASE}/_/api/links/3`);
    expect(lastCall().init.method).toBe("GET");
  });

  it("appends range query param when provided", async () => {
    mockFetch(200, stubLink);
    await client().links.get(3, { range: "7d" });
    expect(lastCall().url).toBe(`${BASE}/_/api/links/3?range=7d`);
  });

  it("omits range when not provided", async () => {
    mockFetch(200, stubLink);
    await client().links.get(3);
    expect(lastCall().url).toBe(`${BASE}/_/api/links/3`);
  });
});

describe("links.list", () => {
  it("GETs /api/links", async () => {
    mockFetch(200, []);
    await client().links.list();
    expect(lastCall().url).toBe(`${BASE}/_/api/links`);
    expect(lastCall().init.method).toBe("GET");
  });

  it("appends owner when provided", async () => {
    mockFetch(200, []);
    await client().links.list({ owner: "user@example.com" });
    expect(lastCall().url).toBe(`${BASE}/_/api/links?owner=user%40example.com`);
  });

  it("appends range when provided", async () => {
    mockFetch(200, []);
    await client().links.list({ range: "30d" });
    expect(lastCall().url).toBe(`${BASE}/_/api/links?range=30d`);
  });
});

describe("links.create", () => {
  it("POSTs /api/links", async () => {
    mockFetch(201, stubLink);
    await client().links.create({ url: "https://example.com", label: "L" });
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links`);
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body["url"]).toBe("https://example.com");
    expect(body["label"]).toBe("L");
  });
});

describe("links.update", () => {
  it("PUTs /api/links/:id", async () => {
    mockFetch(200, stubLink);
    await client().links.update(1, { url: "https://new.com" });
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links/1`);
    expect(init.method).toBe("PUT");
  });
});

describe("links.disable", () => {
  it("POSTs /api/links/:id/disable", async () => {
    mockFetch(200, stubLink);
    await client().links.disable(1);
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links/1/disable`);
    expect(init.method).toBe("POST");
  });
});

describe("links.enable", () => {
  it("POSTs /api/links/:id/enable", async () => {
    mockFetch(200, stubLink);
    await client().links.enable(1);
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links/1/enable`);
    expect(init.method).toBe("POST");
  });
});

describe("links.delete", () => {
  it("DELETEs /api/links/:id and returns {deleted: boolean}", async () => {
    mockFetch(200, { deleted: true });
    const result = await client().links.delete(1);
    expect(result.deleted).toBe(true);
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links/1`);
    expect(init.method).toBe("DELETE");
  });
});

describe("links.analytics", () => {
  const stubStats = {
    total_clicks: 42,
    countries: [],
    referrers: [],
    referrer_hosts: [],
    devices: [],
    os: [],
    browsers: [],
    link_modes: [],
    channels: [],
    clicks_over_time: [],
    slug_clicks: [],
    num_countries: 3,
    num_referrers: 2,
    num_referrer_hosts: 1,
    num_os: 4,
    num_browsers: 2,
  };

  it("GETs /api/links/:id/analytics", async () => {
    mockFetch(200, stubStats);
    await client().links.analytics(5);
    expect(lastCall().url).toBe(`${BASE}/_/api/links/5/analytics`);
  });

  it("appends range when provided", async () => {
    mockFetch(200, stubStats);
    await client().links.analytics(5, { range: "7d" });
    expect(lastCall().url).toBe(`${BASE}/_/api/links/5/analytics?range=7d`);
  });

  it("maps num_countries to numCountries", async () => {
    mockFetch(200, stubStats);
    const stats = await client().links.analytics(5);
    expect(stats.numCountries).toBe(3);
    expect(stats.numReferrerHosts).toBe(1);
    expect(stats.numBrowsers).toBe(2);
    expect(stats.numOs).toBe(4);
  });
});

describe("links.timeline", () => {
  const stubTimeline = {
    range: "7d",
    buckets: [{ label: "Mon", count: 5 }],
    summary: {
      last_24h: 1,
      last_7d: 5,
      last_30d: 10,
      last_90d: 30,
      last_1y: 100,
    },
  };

  it("GETs /api/links/:id/timeline", async () => {
    mockFetch(200, stubTimeline);
    await client().links.timeline(5);
    expect(lastCall().url).toBe(`${BASE}/_/api/links/5/timeline`);
  });

  it("appends range when provided", async () => {
    mockFetch(200, stubTimeline);
    await client().links.timeline(5, { range: "30d" });
    expect(lastCall().url).toBe(`${BASE}/_/api/links/5/timeline?range=30d`);
  });

  it("maps summary keys to camelCase", async () => {
    mockFetch(200, stubTimeline);
    const td = await client().links.timeline(5);
    expect(td.summary.last24h).toBe(1);
    expect(td.summary.last7d).toBe(5);
    expect(td.summary.last30d).toBe(10);
    expect(td.summary.last90d).toBe(30);
    expect(td.summary.last1y).toBe(100);
  });
});

describe("links.qr", () => {
  it("GETs /api/links/:id/qr and returns SVG string", async () => {
    mockFetch(200, "<svg/>", "image/svg+xml");
    const svg = await client().links.qr(5);
    expect(svg).toMatch(/<svg/);
    expect(lastCall().url).toBe(`${BASE}/_/api/links/5/qr`);
  });

  it("appends slug and size when provided", async () => {
    mockFetch(200, "<svg/>", "image/svg+xml");
    await client().links.qr(5, { slug: "promo", size: "256" });
    expect(lastCall().url).toBe(`${BASE}/_/api/links/5/qr?slug=promo&size=256`);
  });
});

// ============================================================
// 5. SlugsResource
// ============================================================

const stubSlug = {
  link_id: 1,
  slug: "abc",
  is_custom: 1,
  is_primary: 0,
  click_count: 0,
  created_at: 1000,
  disabled_at: null,
};

describe("slugs.lookup", () => {
  it("GETs /api/slugs/:slug", async () => {
    mockFetch(200, stubLink);
    await client().slugs.lookup("find-me");
    expect(lastCall().url).toBe(`${BASE}/_/api/slugs/find-me`);
  });

  it("URL-encodes slugs with reserved characters", async () => {
    mockFetch(200, stubLink);
    await client().slugs.lookup("foo/bar");
    expect(lastCall().url).toBe(`${BASE}/_/api/slugs/foo%2Fbar`);
  });
});

describe("slugs.add", () => {
  it("POSTs /api/links/:id/slugs with slug body", async () => {
    mockFetch(201, stubSlug);
    await client().slugs.add(1, "custom");
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links/1/slugs`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ slug: "custom" });
  });
});

describe("slugs.disable", () => {
  it("POSTs /api/links/:id/slugs/:slug/disable", async () => {
    mockFetch(200, stubSlug);
    await client().slugs.disable(1, "abc");
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links/1/slugs/abc/disable`);
    expect(init.method).toBe("POST");
  });
});

describe("slugs.enable", () => {
  it("POSTs /api/links/:id/slugs/:slug/enable", async () => {
    mockFetch(200, stubSlug);
    await client().slugs.enable(1, "abc");
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links/1/slugs/abc/enable`);
    expect(init.method).toBe("POST");
  });
});

describe("slugs.remove", () => {
  it("DELETEs /api/links/:id/slugs/:slug and returns {removed: boolean}", async () => {
    mockFetch(200, { removed: true });
    const result = await client().slugs.remove(1, "abc");
    expect(result.removed).toBe(true);
    const { url, init } = lastCall();
    expect(url).toBe(`${BASE}/_/api/links/1/slugs/abc`);
    expect(init.method).toBe("DELETE");
  });
});

// ============================================================
// 6. Base URL normalization
// ============================================================

describe("Base URL normalization", () => {
  it("strips trailing slashes from baseUrl", async () => {
    const c = new ShrtnrClient({
      baseUrl: BASE + "/",
      apiKey: API_KEY,
      fetch: fetchSpy,
    });
    mockFetch(200, []);
    await c.links.list();
    expect(lastCall().url).toBe(`${BASE}/_/api/links`);
  });

  it("strips multiple trailing slashes", async () => {
    const c = new ShrtnrClient({
      baseUrl: BASE + "///",
      apiKey: API_KEY,
      fetch: fetchSpy,
    });
    mockFetch(200, []);
    await c.links.list();
    expect(lastCall().url).toBe(`${BASE}/_/api/links`);
  });
});

// ============================================================
// 7. Package surface
// ============================================================

describe("Package surface", () => {
  it("does not expose administrative methods on client", () => {
    const c = client() as unknown as Record<string, unknown>;
    expect(c.createLink).toBeUndefined();
    expect(c.getLink).toBeUndefined();
    expect(c.listLinks).toBeUndefined();
    expect(c.health).toBeUndefined();
    expect(typeof c.links).toBe("object");
    expect(typeof c.slugs).toBe("object");
    expect(c.bundles).toBeUndefined();
  });

  it("does not publish an internal admin entrypoint in package.json", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const packageJsonPath = resolve(
      new URL("../package.json", import.meta.url).pathname,
    );
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      exports?: Record<string, unknown>;
    };
    expect(pkg.exports).toBeDefined();
    expect(pkg.exports?.["./internal"]).toBeUndefined();
  });
});
