import { describe, it, expect } from "vitest";
import { getAuthenticatedEmail, unauthorizedResponse } from "../auth";

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

describe("getAuthenticatedEmail", () => {
  it("should extract and lowercase the email from a valid JWT", () => {
    const jwt = makeJwt({ email: "User@Example.COM", sub: "123" });
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": jwt },
    });
    expect(getAuthenticatedEmail(request)).toBe("user@example.com");
  });

  it("should return null when header is missing", () => {
    const request = new Request("https://example.com");
    expect(getAuthenticatedEmail(request)).toBeNull();
  });

  it("should return null for malformed JWT (not 3 parts)", () => {
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": "not.a.valid.jwt.token" },
    });
    expect(getAuthenticatedEmail(request)).toBeNull();
  });

  it("should return null for JWT with invalid base64 payload", () => {
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": "header.!!!invalid!!!.sig" },
    });
    expect(getAuthenticatedEmail(request)).toBeNull();
  });

  it("should return null when email claim is absent", () => {
    const jwt = makeJwt({ sub: "123", name: "Test" });
    const request = new Request("https://example.com", {
      headers: { "Cf-Access-Jwt-Assertion": jwt },
    });
    expect(getAuthenticatedEmail(request)).toBeNull();
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
