// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import {
  getAppSettings,
  updateAppSettings,
  purgeRedirectCache,
} from "../services/admin-management";
import { json, fromServiceResult } from "./response";

type CachePurgeContext = Pick<ExecutionContext, "waitUntil" | "cache">;

export async function handleGetSettings(env: Env, identity: string): Promise<Response> {
  return fromServiceResult(await getAppSettings(env, identity));
}

export async function handleUpdateSettings(request: Request, env: Env, identity: string, ctx?: CachePurgeContext): Promise<Response> {
  let body: {
    slug_default_length?: number;
    theme?: string;
    lang?: string;
    default_range?: string | null;
    filter_bots?: boolean;
    filter_self_referrers?: boolean;
    filter_ai_searches?: boolean;
    root_redirect_url?: string | null;
    redirect_cache_enabled?: boolean;
    redirect_cache_duration_days?: number;
    redirect_cache_threshold_clicks?: number;
    redirect_cache_threshold_window_days?: number;
    dynamic_redirect_strict_match?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  return fromServiceResult(await updateAppSettings(env, identity, body as any, ctx));
}

export async function handlePurgeRedirectCache(env: Env, ctx?: CachePurgeContext): Promise<Response> {
  return fromServiceResult(await purgeRedirectCache(env, ctx));
}
