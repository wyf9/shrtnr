// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { findSlugForRedirect, recordClick } from "./services/link-management";
import { parseDeviceType, parseBrowser, parseOS } from "./ua";
import { notFoundResponse } from "./404";
import { ClickData, Env } from "./types";

function parseReferrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

export async function handleRedirect(
  slug: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const record = await findSlugForRedirect(env, slug.toLowerCase());

  if (!record) {
    return notFoundResponse();
  }

  if (record.expires_at && record.expires_at < Math.floor(Date.now() / 1000)) {
    return notFoundResponse();
  }

  if (record.disabled_at) {
    return notFoundResponse();
  }

  const referrer = request.headers.get("Referer") || null;
  const country = (request as unknown as { cf?: { country?: string } }).cf?.country ?? request.headers.get("cf-ipcountry") ?? null;
  const ua = request.headers.get("User-Agent") || "";

  const url = new URL(request.url);
  const utmMedium = url.searchParams.get("utm_medium")?.toLowerCase() ?? null;

  const data: ClickData = {
    referrer,
    referrerHost: parseReferrerHost(referrer),
    country,
    deviceType: ua ? parseDeviceType(ua) : null,
    os: ua ? parseOS(ua) : null,
    browser: ua ? parseBrowser(ua) : null,
    linkMode: utmMedium === "qr" ? "qr" : "link",
    utmSource: url.searchParams.get("utm_source")?.toLowerCase() ?? null,
    utmMedium,
    utmCampaign: url.searchParams.get("utm_campaign")?.toLowerCase() ?? null,
    utmTerm: url.searchParams.get("utm_term")?.toLowerCase() ?? null,
    utmContent: url.searchParams.get("utm_content")?.toLowerCase() ?? null,
    userAgent: ua || null,
  };

  ctx.waitUntil(recordClick(env, record.id, data));

  return Response.redirect(record.url, 301);
}
