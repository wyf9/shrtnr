import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "cloudflare:test";
import { applyMigrations, resetData } from "./setup";
import { LinkRepository, SlugRepository } from "../db";

beforeAll(applyMigrations);
beforeEach(resetData);

describe("SlugRepository.findByValue", () => {
  it("returns slug with url and expires_at for a known slug", async () => {
    const link = await LinkRepository.create(env.DB, { url: "https://example.com", slug: "abc" });
    const found = await SlugRepository.findByValue(env.DB, "abc");
    expect(found).not.toBeNull();
    expect(found!.slug).toBe("abc");
    expect(found!.url).toBe("https://example.com");
    expect(found!.link_id).toBe(link.id);
    expect(found!.expires_at).toBeNull();
  });

  it("returns null for a non-existent slug", async () => {
    expect(await SlugRepository.findByValue(env.DB, "nope")).toBeNull();
  });

  it("includes expires_at from the parent link", async () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    await LinkRepository.create(env.DB, { url: "https://example.com", slug: "exp", expiresAt: future });
    const found = await SlugRepository.findByValue(env.DB, "exp");
    expect(found!.expires_at).toBe(future);
  });
});

describe("SlugRepository.exists", () => {
  it("returns true for a slug that exists", async () => {
    await LinkRepository.create(env.DB, { url: "https://example.com", slug: "abc" });
    expect(await SlugRepository.exists(env.DB, "abc")).toBe(true);
  });

  it("returns false for a slug that does not exist", async () => {
    expect(await SlugRepository.exists(env.DB, "nonexistent")).toBe(false);
  });
});

describe("SlugRepository.addVanity", () => {
  it("inserts a vanity slug with is_vanity = 1", async () => {
    const link = await LinkRepository.create(env.DB, { url: "https://example.com", slug: "abc" });
    const vanity = await SlugRepository.addVanity(env.DB, link.id, "my-custom");
    expect(vanity.is_vanity).toBe(1);
    expect(vanity.slug).toBe("my-custom");
    expect(vanity.link_id).toBe(link.id);
  });

  it("returns the newly inserted slug row", async () => {
    const link = await LinkRepository.create(env.DB, { url: "https://example.com", slug: "abc" });
    const vanity = await SlugRepository.addVanity(env.DB, link.id, "my-custom");
    expect(vanity.id).toBeGreaterThan(0);
    expect(vanity.click_count).toBe(0);
  });
});
