// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { SELF, env } from "cloudflare:test";
import { LinkRepository, SlugRepository } from "../db";
import { applyMigrations, resetData } from "./setup";

function req(path: string): Request {
  return new Request(`https://shrtnr.test${path}`);
}

beforeAll(applyMigrations);
beforeEach(resetData);

describe("Links listing page", () => {
  it("shows only the primary slug, not other aliases", async () => {
    const link = await LinkRepository.create(env.DB, {
      url: "https://example.com",
      slug: "abc",
    });
    // First custom slug becomes primary automatically
    await SlugRepository.addCustom(env.DB, link.id, "my-custom-alias");
    await SlugRepository.addCustom(env.DB, link.id, "another-alias");

    const res = await SELF.fetch(req("/_/admin/links"));
    expect(res.status).toBe(200);
    const html = await res.text();

    // The primary slug (first custom added) should appear
    expect(html).toContain("my-custom-alias");
    // Non-primary slugs should not appear on the listing page
    expect(html).not.toContain("another-alias");
  });

  it("shows the designated primary slug when a custom slug is set as primary", async () => {
    const link = await LinkRepository.create(env.DB, {
      url: "https://example.com",
      slug: "abc",
    });
    await SlugRepository.addCustom(env.DB, link.id, "branded-link");
    await SlugRepository.setPrimary(env.DB, link.id, "branded-link");

    const res = await SELF.fetch(req("/_/admin/links"));
    expect(res.status).toBe(200);
    const html = await res.text();

    // The designated primary slug should appear
    expect(html).toContain("branded-link");
  });
});
