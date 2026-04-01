// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from "vitest";
import { env, SELF } from "cloudflare:test";

// ---- OAuth callback error handling ----

describe("OAuth callback error handling", () => {
  it("returns 400 when state parameter is missing", async () => {
    const res = await SELF.fetch(
      new Request("https://shrtnr.test/oauth/callback?code=any-code"),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; error_description: string };
    expect(body.error).toBe("invalid_request");
  });

  it("returns 400 when state does not exist in KV", async () => {
    const res = await SELF.fetch(
      new Request("https://shrtnr.test/oauth/callback?code=any-code&state=nonexistent-state"),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; error_description: string };
    expect(body.error).toBe("invalid_request");
  });

  it("returns 500 (not an unhandled crash) when upstream token exchange fails", async () => {
    // Put a valid state in KV so we get past the state validation,
    // then hit the upstream token exchange which will fail in tests.
    const stateToken = "test-state-token-12345";
    await env.OAUTH_KV.put(
      `oauth:state:${stateToken}`,
      JSON.stringify({
        responseType: "code",
        clientId: "test-client",
        redirectUri: "https://example.com/callback",
        scope: [],
        state: "original-state",
        codeChallenge: undefined,
        codeChallengeMethod: "S256",
      }),
    );

    const res = await SELF.fetch(
      new Request(`https://shrtnr.test/oauth/callback?code=test-code&state=${stateToken}`),
    );
    // Should return a proper response (not a Worker crash with empty body)
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(600);
    // Verify the state was consumed (one-time use)
    const stateData = await env.OAUTH_KV.get(`oauth:state:${stateToken}`);
    expect(stateData).toBeNull();
  });
});
