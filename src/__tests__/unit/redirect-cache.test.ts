// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:test";
import { applyMigrations, resetData } from "../setup";
import { LinkRepository, ClickRepository } from "../../db";
import { RedirectCacheMarker } from "../../kv";

beforeAll(applyMigrations);
beforeEach(resetData);

describe("RedirectCacheMarker", () => {
  it("marks a slug as cached and reads it back", async () => {
    expect(await RedirectCacheMarker.isCached(env.SLUG_KV, "hot")).toBe(false);
    await RedirectCacheMarker.mark(env.SLUG_KV, "hot", 3600);
    expect(await RedirectCacheMarker.isCached(env.SLUG_KV, "hot")).toBe(true);
  });

  it("filters a mixed list to only cached slugs", async () => {
    await RedirectCacheMarker.mark(env.SLUG_KV, "a", 3600);
    await RedirectCacheMarker.mark(env.SLUG_KV, "c", 3600);
    const cached = await RedirectCacheMarker.filterCached(env.SLUG_KV, ["a", "b", "c", "d"]);
    expect([...cached].sort()).toEqual(["a", "c"]);
  });

  it("unmarks a single slug", async () => {
    await RedirectCacheMarker.mark(env.SLUG_KV, "x", 3600);
    await RedirectCacheMarker.unmark(env.SLUG_KV, "x");
    expect(await RedirectCacheMarker.isCached(env.SLUG_KV, "x")).toBe(false);
  });

  it("clearAll removes every marker", async () => {
    await RedirectCacheMarker.mark(env.SLUG_KV, "m1", 3600);
    await RedirectCacheMarker.mark(env.SLUG_KV, "m2", 3600);
    await RedirectCacheMarker.clearAll(env.SLUG_KV);
    const cached = await RedirectCacheMarker.filterCached(env.SLUG_KV, ["m1", "m2"]);
    expect(cached.size).toBe(0);
  });
});

describe("ClickRepository.countSince", () => {
  it("counts only clicks at or after the cutoff", async () => {
    const link = await LinkRepository.create(env.DB, { url: "https://example.com", slug: "cnt" });
    const slug = link.slugs[0].slug;
    const now = Math.floor(Date.now() / 1000);

    // Two recent clicks, one old click.
    await env.DB.prepare("INSERT INTO clicks (slug, clicked_at, link_mode) VALUES (?, ?, 'link')").bind(slug, now - 60).run();
    await env.DB.prepare("INSERT INTO clicks (slug, clicked_at, link_mode) VALUES (?, ?, 'link')").bind(slug, now - 120).run();
    await env.DB.prepare("INSERT INTO clicks (slug, clicked_at, link_mode) VALUES (?, ?, 'link')").bind(slug, now - 10 * 86400).run();

    expect(await ClickRepository.countSince(env.DB, slug, now - 7 * 86400)).toBe(2);
    expect(await ClickRepository.countSince(env.DB, slug, now - 30 * 86400)).toBe(3);
  });

  it("counts bot clicks too (caching is about request volume)", async () => {
    const link = await LinkRepository.create(env.DB, { url: "https://example.com", slug: "cnt2" });
    const slug = link.slugs[0].slug;
    const now = Math.floor(Date.now() / 1000);
    await ClickRepository.record(env.DB, slug, { isBot: 1 });
    expect(await ClickRepository.countSince(env.DB, slug, now - 86400)).toBe(1);
  });
});
