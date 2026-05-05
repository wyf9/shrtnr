import { describe, it, expect } from "vitest";
import { matchDynamicRedirect, parseDynamicRedirectRules } from "../../redirect-rules";

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
    expect(parsed.rules[1].status).toBe(301);
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
    const parsed = parseDynamicRedirectRules("/t/m/:name https://siiway.org/go/mail?name=:name");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const match = matchDynamicRedirect(parsed.rules, "/t/m/alice", "https://shrtnr.test/t/m/alice");
    expect(match).toEqual({
      url: "https://siiway.org/go/mail?name=alice",
      status: 302,
    });
  });

  it("resolves splat to :splat and supports relative targets", () => {
    const parsed = parseDynamicRedirectRules("/a/* /about/:splat 302");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const match = matchDynamicRedirect(parsed.rules, "/a/team/core", "https://short.example/a/team/core");
    expect(match).toEqual({
      url: "https://short.example/about/team/core",
      status: 302,
    });
  });
});
