// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import {
  CustomSlugStringSchema,
  BundleAccentSchema,
  BUNDLE_ACCENTS,
  TIMELINE_RANGES,
  CreateLinkBodySchema,
  UpdateLinkBodySchema,
} from "../../api/schemas";

describe("CustomSlugStringSchema", () => {
  it.each([
    ["abc", true],
    ["a-b-c", true],
    ["Marketing-Page", true],
    ["a", true],
    ["a1", true],
    ["1abc", true],
    ["", false],
    ["under_score", false],
    ["-leading", false],
    ["trailing-", false],
    ["with space", false],
    ["sl/ash", false],
    ["a".repeat(65), false],
  ])("safeParse(%j) -> ok=%s", (value, expectedOk) => {
    const result = CustomSlugStringSchema.safeParse(value);
    expect(result.success).toBe(expectedOk);
  });
});

describe("BundleAccentSchema", () => {
  it("accepts every BUNDLE_ACCENTS entry", () => {
    for (const accent of BUNDLE_ACCENTS) {
      expect(BundleAccentSchema.safeParse(accent).success).toBe(true);
    }
  });

  it("rejects an unknown accent", () => {
    expect(BundleAccentSchema.safeParse("magenta").success).toBe(false);
  });
});

describe("TIMELINE_RANGES", () => {
  it("matches the documented public range set", () => {
    expect([...TIMELINE_RANGES]).toEqual(["24h", "7d", "30d", "90d", "1y", "all"]);
  });
});

describe("CreateLinkBodySchema.expires_at", () => {
  it("rejects a negative timestamp", () => {
    const result = CreateLinkBodySchema.safeParse({
      url: "https://example.com",
      expires_at: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero", () => {
    const result = CreateLinkBodySchema.safeParse({
      url: "https://example.com",
      expires_at: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateLinkBodySchema.expires_at", () => {
  it("rejects a negative timestamp", () => {
    const result = UpdateLinkBodySchema.safeParse({ expires_at: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts null (clears expiry)", () => {
    const result = UpdateLinkBodySchema.safeParse({ expires_at: null });
    expect(result.success).toBe(true);
  });
});
