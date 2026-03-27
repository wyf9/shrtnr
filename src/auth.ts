// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

/**
 * Extract the authenticated email from a Cloudflare Access JWT.
 *
 * Cloudflare Access sits in front of /_/* routes and sets the
 * `Cf-Access-Jwt-Assertion` header on authenticated requests.
 * Access has already validated the token and enforced the policy —
 * the Worker just reads the email claim.
 */
export function getAuthenticatedEmail(request: Request): string | null {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!jwt) return null;

  const payload = decodeJwtPayload(jwt);
  if (!payload) return null;

  const email = payload.email as string | undefined;
  if (!email) return null;

  return email.toLowerCase();
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
