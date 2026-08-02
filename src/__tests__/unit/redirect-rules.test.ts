import { describe, it, expect } from "vitest";
import {
  matchDynamicRedirect,
  parseDynamicRedirectRules,
} from "../../redirect-rules";

describe("parseDynamicRedirectRules", () => {
  it("parses placeholders and splat rules", () => {
    const parsed = parseDynamicRedirectRules(`
# comment
/mail/:email https://siiway.org/go/mail?email=:email
/a/* https://siiway.org/about/:splat 301
`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rules).toHaveLength(2);
    expect(parsed.rules[0].source).toBe("/mail/:email");
    expect(parsed.rules[1].source).toBe("/a/*");
  });

  it("rejects malformed rules with line number", () => {
    const parsed = parseDynamicRedirectRules("/a/*/b https://example.com");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toContain("line 1");
  });
});

describe("matchDynamicRedirect", () => {
  it("resolves placeholder tokens", () => {
    const parsed = parseDynamicRedirectRules(
      "/t/m/:name https://siiway.org/go/mail?name=:name",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const match = matchDynamicRedirect(
      parsed.rules,
      "/t/m/alice",
      "https://shrtnr.test/t/m/alice",
    );
    expect(match).toEqual({
      url: "https://siiway.org/go/mail?name=alice",
    });
  });

  it("resolves splat to :splat and supports relative targets", () => {
    const parsed = parseDynamicRedirectRules("/a/* /about/:splat 302");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const match = matchDynamicRedirect(
      parsed.rules,
      "/a/team/core",
      "https://short.example/a/team/core",
    );
    expect(match).toEqual({
      url: "https://short.example/about/team/core",
    });
  });

  it("never matches a splat rule when the path lacks the trailing separator", () => {
    const parsed = parseDynamicRedirectRules(
      "/m/* https://siiway.org/zh/members/:splat",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    // "/m" has no "/" for the splat to sit behind, so "/m/*" must not fire in
    // either strict or non-strict mode.
    expect(
      matchDynamicRedirect(parsed.rules, "/m", "https://short.example/m"),
    ).toBeNull();
    expect(
      matchDynamicRedirect(parsed.rules, "/m", "https://short.example/m", true),
    ).toBeNull();
  });

  it("matches an empty splat only when strict matching is disabled", () => {
    const parsed = parseDynamicRedirectRules(
      "/m/* https://siiway.org/zh/members/:splat",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    // Non-strict: "/m/" matches with an empty splat.
    expect(
      matchDynamicRedirect(parsed.rules, "/m/", "https://short.example/m/"),
    ).toEqual({
      url: "https://siiway.org/zh/members/",
    });
    // Strict: an empty splat is rejected.
    expect(
      matchDynamicRedirect(
        parsed.rules,
        "/m/",
        "https://short.example/m/",
        true,
      ),
    ).toBeNull();
    // Strict: a non-empty splat still matches.
    expect(
      matchDynamicRedirect(
        parsed.rules,
        "/m/alice",
        "https://short.example/m/alice",
        true,
      ),
    ).toEqual({
      url: "https://siiway.org/zh/members/alice",
    });
  });

  it("rejects empty placeholder captures in strict mode", () => {
    const parsed = parseDynamicRedirectRules(
      "/a/:name https://example.com/:name",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    // "/a" never matches "/a/:name" because the placeholder segment is absent.
    expect(
      matchDynamicRedirect(parsed.rules, "/a", "https://short.example/a"),
    ).toBeNull();
    // "/a/" matches with an empty capture only when strict matching is off.
    expect(
      matchDynamicRedirect(parsed.rules, "/a/", "https://short.example/a/"),
    ).toEqual({
      url: "https://example.com/",
    });
    expect(
      matchDynamicRedirect(
        parsed.rules,
        "/a/",
        "https://short.example/a/",
        true,
      ),
    ).toBeNull();
  });
});
