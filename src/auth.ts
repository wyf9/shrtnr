// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

/**
 * Represents an authenticated caller's identity extracted from a JWT.
 */
export type Identity = {
  id: string;
  displayName: string;
};

/**
 * Extract the caller's identity from a Cloudflare Access JWT.
 *
 * Tries the `email` claim first (most readable), then falls back to the
 * `sub` claim (always present in standard JWTs). Returns an anonymous
 * identity when the header is missing, the token is malformed, or no
 * usable claim is found. This keeps the app functional without
 * Cloudflare Access: the user is simply treated as "anonymous".
 */
export const ANONYMOUS_IDENTITY: Identity = {
  id: "anonymous",
  displayName: "anonymous",
};

export function getIdentity(request: Request): Identity {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt) return ANONYMOUS_IDENTITY;

  const payload = decodeJwtPayload(jwt);
  if (!payload) return ANONYMOUS_IDENTITY;

  const email =
    typeof payload.email === "string" && payload.email
      ? payload.email.toLowerCase().trim()
      : null;
  const sub =
    typeof payload.sub === "string" && payload.sub ? payload.sub : null;

  const id = email || sub;
  if (!id) return ANONYMOUS_IDENTITY;

  return { id, displayName: email || sub || id };
}

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
