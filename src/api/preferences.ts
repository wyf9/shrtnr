// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import { getUserPreferences, setUserPreference } from "../db";

const VALID_THEMES = ["oddbit", "dark", "light"];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetPreferences(env: Env, email: string): Promise<Response> {
  const prefs = await getUserPreferences(env.DB, email);
  return json(prefs);
}

export async function handleUpdatePreferences(request: Request, env: Env, email: string): Promise<Response> {
  let body: { theme?: string };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.theme !== undefined) {
    if (!VALID_THEMES.includes(body.theme)) {
      return json({ error: "Invalid theme. Must be one of: " + VALID_THEMES.join(", ") }, 400);
    }
    await setUserPreference(env.DB, email, "theme", body.theme);
  }

  return handleGetPreferences(env, email);
}
