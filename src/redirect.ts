// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { findSlugByValue, recordClick } from "./db";
import { parseDeviceType, parseBrowser } from "./ua";

export async function handleRedirect(
  slug: string,
  request: Request,
  db: D1Database,
  ctx: ExecutionContext
): Promise<Response> {
  const record = await findSlugByValue(db, slug);

  if (!record) {
    return new Response(notFoundPage(slug), {
      status: 404,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }

  // Check expiry
  if (record.expires_at && record.expires_at < Math.floor(Date.now() / 1000)) {
    return new Response(notFoundPage(slug), {
      status: 404,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
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

function notFoundPage(slug: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Not Found</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; color: #333; }
    .container { text-align: center; }
    h1 { font-size: 4rem; margin: 0; }
    p { font-size: 1.2rem; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>The link <code>/${slug}</code> was not found.</p>
  </div>
</body>
</html>`;
}
