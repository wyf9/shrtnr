// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { findSlugByValue, recordClick } from "./db";
import { parseDeviceType, parseBrowser } from "./ua";
import { notFoundResponse } from "./404";

export async function handleRedirect(
  slug: string,
  request: Request,
  db: D1Database,
  ctx: ExecutionContext
): Promise<Response> {
  const record = await findSlugByValue(db, slug);

  if (!record) {
    return notFoundResponse();
  }

  // Check expiry
  if (record.expires_at && record.expires_at < Math.floor(Date.now() / 1000)) {
    return notFoundResponse();
  }

  // Extract analytics data
  const referrer = request.headers.get("Referer") || null;
  const country = (request as unknown as { cf?: { country?: string } }).cf?.country ?? request.headers.get("cf-ipcountry") ?? null;
  const ua = request.headers.get("User-Agent") || "";
  const deviceType = ua ? parseDeviceType(ua) : null;
  const browser = ua ? parseBrowser(ua) : null;

  // Async click recording — does not block the redirect
  ctx.waitUntil(recordClick(db, record.id, referrer, country, deviceType, browser));

  return Response.redirect(record.url, 301);
}
