import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:test";
import { applyMigrations, resetData } from "./setup";
import { LinkRepository, ClickRepository } from "../db";
import { computeDelta } from "../services/trends";

beforeAll(applyMigrations);
beforeEach(resetData);

describe("computeDelta", () => {
  it("returns 0 when both values are zero", () => {
    expect(computeDelta(0, 0)).toBe(0);
  });

  it("returns positive percent when current is higher than previous", () => {
    expect(computeDelta(120, 100)).toBe(20);
  });

  it("returns negative percent when current is lower than previous", () => {
    expect(computeDelta(80, 100)).toBe(-20);
  });

  it("returns 100 when previous is zero and current is positive", () => {
    expect(computeDelta(50, 0)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(computeDelta(107, 100)).toBe(7);
    expect(computeDelta(93, 100)).toBe(-7);
  });
});

describe("ClickRepository.getPeriodClicks", () => {
  it("splits clicks into current and previous periods", async () => {
    const link = await LinkRepository.create(env.DB, { url: "https://example.com", slug: "abc" });
    const slug = link.slugs[0].slug;
    const now = Math.floor(Date.now() / 1000);

    // Insert clicks at specific timestamps.
    // Current 24h window: now-86400 .. now.
    // Previous 24h window: now-172800 .. now-86400.
    const insertClick = async (t: number) =>
      env.DB.prepare("INSERT INTO clicks (slug, clicked_at) VALUES (?, ?)").bind(slug, t).run();

    // 3 current clicks
    await insertClick(now - 100);
    await insertClick(now - 200);
    await insertClick(now - 300);
    // 1 previous click
    await insertClick(now - 90000);

    const result = await ClickRepository.getPeriodClicks(env.DB, "24h", now);
    expect(result.current).toBe(3);
    expect(result.previous).toBe(1);
  });

  it("returns 0 for previous when range is all", async () => {
    const result = await ClickRepository.getPeriodClicks(env.DB, "all");
    expect(result.previous).toBe(0);
  });

  it("counts per-link when linkId is given", async () => {
    const a = await LinkRepository.create(env.DB, { url: "https://a.example", slug: "aaa" });
    const b = await LinkRepository.create(env.DB, { url: "https://b.example", slug: "bbb" });
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare("INSERT INTO clicks (slug, clicked_at) VALUES (?, ?)").bind(a.slugs[0].slug, now - 100).run();
    await env.DB.prepare("INSERT INTO clicks (slug, clicked_at) VALUES (?, ?)").bind(a.slugs[0].slug, now - 200).run();
    await env.DB.prepare("INSERT INTO clicks (slug, clicked_at) VALUES (?, ?)").bind(b.slugs[0].slug, now - 100).run();

    const resA = await ClickRepository.getPeriodClicks(env.DB, "24h", now, a.id);
    expect(resA.current).toBe(2);
    const resB = await ClickRepository.getPeriodClicks(env.DB, "24h", now, b.id);
    expect(resB.current).toBe(1);
  });
});

describe("getDashboardStats with trends", () => {
  it("includes delta_pct for total clicks", async () => {
    const link = await LinkRepository.create(env.DB, { url: "https://example.com", slug: "abc" });
    const slug = link.slugs[0].slug;
    const now = Math.floor(Date.now() / 1000);

    // 10 in current 30d
    for (let i = 0; i < 10; i++) {
      await env.DB.prepare("INSERT INTO clicks (slug, clicked_at) VALUES (?, ?)").bind(slug, now - i * 3600).run();
    }
    // 5 in previous 30d (30-60 days ago)
    for (let i = 0; i < 5; i++) {
      await env.DB.prepare("INSERT INTO clicks (slug, clicked_at) VALUES (?, ?)").bind(slug, now - (35 + i) * 86400).run();
    }

    const stats = await ClickRepository.getDashboardStats(env.DB, "30d", now);
    expect(stats.total_clicks).toBe(10);
    expect(stats.total_clicks_delta).toBe(100); // 10 vs 5 => +100%
  });
});
