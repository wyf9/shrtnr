import { describe, it, expect } from "vitest";
import { ANONYMOUS_IDENTITY, getIdentity, unauthorizedResponse } from "../auth";

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

describe("getIdentity", () => {
  it("should prefer email claim and lowercase it", () => {
    const jwt = makeJwt({ email: "User@Example.COM", sub: "123" });
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": jwt },
    });
    const identity = getIdentity(request);
    expect(identity).toEqual({ id: "user@example.com", displayName: "user@example.com" });
  });

  it("should fall back to sub when email is absent", () => {
    const jwt = makeJwt({ sub: "cf-user-abc123" });
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": jwt },
    });
    const identity = getIdentity(request);
    expect(identity).toEqual({ id: "cf-user-abc123", displayName: "cf-user-abc123" });
  });

  it("should return anonymous identity when header is missing", () => {
    const request = new Request("https://example.com");
    expect(getIdentity(request)).toBe(ANONYMOUS_IDENTITY);
  });

  it("should return anonymous identity for malformed JWT (not 3 parts)", () => {
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": "not.a.valid.jwt.token" },
    });
    expect(getIdentity(request)).toBe(ANONYMOUS_IDENTITY);
  });

  it("should return anonymous identity for JWT with invalid base64 payload", () => {
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": "header.!!!invalid!!!.sig" },
    });
    expect(getIdentity(request)).toBe(ANONYMOUS_IDENTITY);
  });

  it("should return anonymous identity when neither email nor sub is present", () => {
    const jwt = makeJwt({ name: "Test" });
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": jwt },
    });
    expect(getIdentity(request)).toBe(ANONYMOUS_IDENTITY);
  });
});

describe("unauthorizedResponse", () => {
  it("should return 401 with JSON error", async () => {
    const res = unauthorizedResponse();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
