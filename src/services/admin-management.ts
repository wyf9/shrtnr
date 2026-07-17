// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { ApiKeyRepository, SettingRepository } from "../db";
import type { ApiKeyRow, ClickFilters } from "../db";
import { DEFAULT_SLUG_LENGTH, REDIRECT_CACHE_TAG } from "../constants";
import { validateSlugLength } from "../slugs";
import { parseDynamicRedirectRules, matchDynamicRedirect } from "../redirect-rules";
import { Env, TimelineRange } from "../types";
import { ServiceResult, ok, fail } from "./result";

const VALID_RANGES: TimelineRange[] = ["24h", "7d", "30d", "90d", "1y", "all"];
const DEFAULT_RANGE: TimelineRange = "30d";

type CachePurgeContext = Pick<ExecutionContext, "waitUntil" | "cache">;

/**
 * Drop every cached redirect response by purging the shared cache tag that
 * `handleRedirect` attaches to all of them. No-op when the runtime does not
 * expose a cache-purge binding (e.g. local dev without the feature).
 */
function purgeAllRedirectCache(ctx: CachePurgeContext | undefined): void {
  if (!ctx?.cache) return;
  ctx.waitUntil(ctx.cache.purge({ tags: [REDIRECT_CACHE_TAG] }).then(() => undefined));
}

function isValidRange(v: unknown): v is TimelineRange {
  return typeof v === "string" && (VALID_RANGES as string[]).includes(v);
}

export type { ServiceResult };

const VALID_SCOPES = ["create", "read", "create,read"];

async function hashKey(raw: string): Promise<string> {
  const encoded = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateRawKey(): string {
  return "sk_" + Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listAllApiKeys(env: Env, identity: string): Promise<ServiceResult<unknown[]>> {
  const keys = await ApiKeyRepository.list(env.DB, identity);
  const safe = keys.map(({ key_hash, identity: _id, ...rest }) => rest);
  return ok(safe);
}

export async function createNewApiKey(
  env: Env,
  identity: string,
  body: { title?: string; scope?: string },
): Promise<ServiceResult<{ key: unknown; raw_key: string }>> {
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return fail(400, "Title is required");
  }
  if (!body.scope || !VALID_SCOPES.includes(body.scope)) {
    return fail(400, "Scope must be one of: " + VALID_SCOPES.join(", "));
  }

  const rawKey = generateRawKey();
  const keyHash = await hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 7);

  const key = await ApiKeyRepository.create(env.DB, {
    identity,
    title: body.title.trim(),
    keyPrefix,
    keyHash,
    scope: body.scope,
  });

  const { key_hash, identity: _id, ...safeKey } = key;
  return ok({ key: safeKey, raw_key: rawKey }, 201);
}

export async function deleteApiKeyById(env: Env, identity: string, id: number): Promise<ServiceResult<{ ok: true }>> {
  const deleted = await ApiKeyRepository.delete(env.DB, identity, id);
  if (!deleted) return fail(404, "Key not found");
  return ok({ ok: true });
}

export async function authenticateApiKey(env: Env, rawKey: string): Promise<ApiKeyRow | null> {
  const keyHash = await hashKey(rawKey);
  const row = await ApiKeyRepository.findByHash(env.DB, keyHash);
  if (!row) return null;
  await ApiKeyRepository.updateLastUsed(env.DB, row.id);
  return { ...row, last_used_at: Math.floor(Date.now() / 1000) };
}

export type AppSettings = {
  slug_default_length: number;
  theme: string | null;
  lang: string | null;
  default_range: TimelineRange;
  filter_bots: boolean;
  filter_self_referrers: boolean;
  filter_ai_searches: boolean;
  root_redirect_url: string | null;
  redirect_cache_enabled: boolean;
  dynamic_redirect_strict_match: boolean;
};

// Stored as "true" / "false" strings in the key-value settings table; absent row
// means default-on so fresh installs exclude bots and self-referrers everywhere.
function parseBoolSetting(v: string | null, defaultValue: boolean): boolean {
  if (v === null) return defaultValue;
  if (v === "true") return true;
  if (v === "false") return false;
  return defaultValue;
}

function normalizeRootRedirectUrl(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function getAppSettings(
  env: Env,
  identity: string,
): Promise<ServiceResult<AppSettings>> {
  const [slugLength, theme, lang, defaultRange, filterBots, filterSelfReferrers, filterAiSearches, rootRedirectUrl, redirectCacheEnabled, dynamicRedirectStrictMatch] = await Promise.all([
    SettingRepository.get(env.DB, identity, "slug_default_length"),
    SettingRepository.get(env.DB, identity, "theme"),
    SettingRepository.get(env.DB, identity, "lang"),
    SettingRepository.get(env.DB, identity, "default_range"),
    SettingRepository.get(env.DB, identity, "filter_bots"),
    SettingRepository.get(env.DB, identity, "filter_self_referrers"),
    SettingRepository.get(env.DB, identity, "filter_ai_searches"),
    SettingRepository.get(env.DB, "anonymous", "root_redirect_url"),
    SettingRepository.get(env.DB, "anonymous", "redirect_cache_enabled"),
    SettingRepository.get(env.DB, "anonymous", "dynamic_redirect_strict_match"),
  ]);
  return ok({
    slug_default_length: parseInt(slugLength ?? String(DEFAULT_SLUG_LENGTH), 10),
    theme: theme ?? null,
    lang: lang ?? null,
    default_range: isValidRange(defaultRange) ? defaultRange : DEFAULT_RANGE,
    filter_bots: parseBoolSetting(filterBots, true),
    filter_self_referrers: parseBoolSetting(filterSelfReferrers, true),
    filter_ai_searches: parseBoolSetting(filterAiSearches, true),
    root_redirect_url: normalizeRootRedirectUrl(rootRedirectUrl),
    redirect_cache_enabled: parseBoolSetting(redirectCacheEnabled, false),
    dynamic_redirect_strict_match: parseBoolSetting(dynamicRedirectStrictMatch, false),
  });
}

export async function updateAppSettings(
  env: Env,
  identity: string,
  body: {
    slug_default_length?: number;
    theme?: string;
    lang?: string;
    default_range?: TimelineRange | null | "";
    filter_bots?: boolean;
    filter_self_referrers?: boolean;
    filter_ai_searches?: boolean;
    root_redirect_url?: string | null;
    redirect_cache_enabled?: boolean;
    dynamic_redirect_strict_match?: boolean;
  },
  ctx?: CachePurgeContext,
): Promise<ServiceResult<AppSettings>> {
  if (body.slug_default_length !== undefined) {
    const err = validateSlugLength(body.slug_default_length);
    if (err) return fail(400, err);
    await SettingRepository.set(env.DB, identity, "slug_default_length", String(body.slug_default_length));
  }
  if (body.theme !== undefined && typeof body.theme === "string") {
    await SettingRepository.set(env.DB, identity, "theme", body.theme);
  }
  if (body.lang !== undefined && typeof body.lang === "string") {
    await SettingRepository.set(env.DB, identity, "lang", body.lang);
  }
  if (body.default_range !== undefined) {
    if (body.default_range === null || body.default_range === "") {
      await SettingRepository.set(env.DB, identity, "default_range", "");
    } else if (isValidRange(body.default_range)) {
      await SettingRepository.set(env.DB, identity, "default_range", body.default_range);
    } else {
      return fail(400, `default_range must be one of: ${VALID_RANGES.join(", ")}`);
    }
  }
  if (body.filter_bots !== undefined) {
    if (typeof body.filter_bots !== "boolean") {
      return fail(400, "filter_bots must be a boolean");
    }
    await SettingRepository.set(env.DB, identity, "filter_bots", String(body.filter_bots));
  }
  if (body.filter_self_referrers !== undefined) {
    if (typeof body.filter_self_referrers !== "boolean") {
      return fail(400, "filter_self_referrers must be a boolean");
    }
    await SettingRepository.set(env.DB, identity, "filter_self_referrers", String(body.filter_self_referrers));
  }
  if (body.filter_ai_searches !== undefined) {
    if (typeof body.filter_ai_searches !== "boolean") {
      return fail(400, "filter_ai_searches must be a boolean");
    }
    await SettingRepository.set(env.DB, identity, "filter_ai_searches", String(body.filter_ai_searches));
  }
  if (body.root_redirect_url !== undefined) {
    if (body.root_redirect_url === null || body.root_redirect_url.trim() === "") {
      await SettingRepository.set(env.DB, "anonymous", "root_redirect_url", "");
    } else {
      const normalized = normalizeRootRedirectUrl(body.root_redirect_url);
      if (!normalized) {
        return fail(400, "root_redirect_url must be a valid http or https URL");
      }
      await SettingRepository.set(env.DB, "anonymous", "root_redirect_url", normalized);
    }
  }
  if (body.redirect_cache_enabled !== undefined) {
    if (typeof body.redirect_cache_enabled !== "boolean") {
      return fail(400, "redirect_cache_enabled must be a boolean");
    }
    await SettingRepository.set(env.DB, "anonymous", "redirect_cache_enabled", String(body.redirect_cache_enabled));
    // Turning the cache off must also drop every already-cached redirect.
    // Otherwise clients keep replaying the long-lived 301 straight from the
    // edge, the Worker never runs, and click analytics stay broken until the
    // year-long TTL expires. Purge all redirect responses so tracking resumes
    // immediately.
    if (body.redirect_cache_enabled === false) {
      purgeAllRedirectCache(ctx);
    }
  }
  if (body.dynamic_redirect_strict_match !== undefined) {
    if (typeof body.dynamic_redirect_strict_match !== "boolean") {
      return fail(400, "dynamic_redirect_strict_match must be a boolean");
    }
    await SettingRepository.set(env.DB, "anonymous", "dynamic_redirect_strict_match", String(body.dynamic_redirect_strict_match));
  }

  return getAppSettings(env, identity);
}

/**
 * Manually drop every cached redirect. Exposed as an admin action so operators
 * can force stale 301s out of the edge cache without waiting for the TTL, for
 * example after noticing analytics undercounting.
 */
export async function purgeRedirectCache(ctx?: CachePurgeContext): Promise<ServiceResult<{ ok: true }>> {
  purgeAllRedirectCache(ctx);
  return ok({ ok: true });
}

export async function isRedirectCacheEnabled(env: Env): Promise<boolean> {
  const stored = await SettingRepository.get(env.DB, "anonymous", "redirect_cache_enabled");
  return parseBoolSetting(stored, false);
}

export async function getRootRedirectUrl(env: Env): Promise<string | null> {
  const stored = await SettingRepository.get(env.DB, "anonymous", "root_redirect_url");
  return normalizeRootRedirectUrl(stored);
}

export async function getDynamicRedirectRules(env: Env): Promise<string> {
  const stored = await SettingRepository.get(env.DB, "anonymous", "dynamic_redirect_rules");
  return stored ?? "";
}

export async function isDynamicRedirectStrictMatchEnabled(env: Env): Promise<boolean> {
  const stored = await SettingRepository.get(env.DB, "anonymous", "dynamic_redirect_strict_match");
  return parseBoolSetting(stored, false);
}

export async function getDynamicRedirect(env: Env, requestUrl: string): Promise<{ url: string } | null> {
  const [rules, strict] = await Promise.all([
    getDynamicRedirectRules(env),
    isDynamicRedirectStrictMatchEnabled(env),
  ]);
  const parsed = parseDynamicRedirectRules(rules);
  if (!parsed.ok || parsed.rules.length === 0) return null;
  const pathname = new URL(requestUrl).pathname;
  return matchDynamicRedirect(parsed.rules, pathname, requestUrl, strict);
}

/**
 * Resolve the viewer's analytics filter preferences into a ClickFilters object
 * ready to pass to the repository layer.
 */
export async function resolveClickFilters(env: Env, identity: string): Promise<ClickFilters> {
  const result = await getAppSettings(env, identity);
  if (!result.ok) return { excludeBots: true, excludeSelfReferrers: true, excludeAiSearches: true };
  return {
    excludeBots: result.data.filter_bots,
    excludeSelfReferrers: result.data.filter_self_referrers,
    excludeAiSearches: result.data.filter_ai_searches,
  };
}

/**
 * Pick the time range an MCP tool should query.
 *
 * MCP tools mirror the admin UI: when the caller does not specify a range,
 * fall back to the user's resolved `default_range` setting. Returns the
 * resolved range so the tool can tell the requesting AI which window the
 * data covers via a `range_used` field.
 */
export async function resolveMcpRange(
  env: Env,
  identity: string,
  requested?: TimelineRange,
): Promise<TimelineRange> {
  if (requested) return requested;
  const result = await getAppSettings(env, identity);
  return result.ok ? result.data.default_range : DEFAULT_RANGE;
}
