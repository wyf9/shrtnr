// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import { SettingRepository } from "../db/setting-repository";
import { json } from "./response";
import { parseDynamicRedirectRules } from "../redirect-rules";

export async function handleGetRedirectRules(env: Env): Promise<Response> {
  const rules = await SettingRepository.get(env.DB, "anonymous", "dynamic_redirect_rules");
  return json({ rules: rules ?? "" });
}

export async function handleUpdateRedirectRules(request: Request, env: Env): Promise<Response> {
  let body: { rules?: string | null };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const rawRules = body.rules ?? "";
  const parsed = parseDynamicRedirectRules(rawRules);
  if (!parsed.ok) {
    return json({ error: parsed.error }, 400);
  }

  await SettingRepository.set(env.DB, "anonymous", "dynamic_redirect_rules", rawRules.trim());
  return json({ rules: rawRules.trim() });
}
