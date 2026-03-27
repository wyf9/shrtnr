// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import { getSetting, setSetting } from "../db";
import { validateSlugLength } from "../slugs";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGetSettings(env: Env): Promise<Response> {
  const slugLength = await getSetting(env.DB, "slug_default_length");
  return json({
    slug_default_length: parseInt(slugLength ?? env.SLUG_DEFAULT_LENGTH, 10),
  });
}

export async function handleUpdateSettings(request: Request, env: Env): Promise<Response> {
  let body: { slug_default_length?: number };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.slug_default_length !== undefined) {
    const err = validateSlugLength(body.slug_default_length);
    if (err) return json({ error: err }, 400);
    await setSetting(env.DB, "slug_default_length", String(body.slug_default_length));
  }

  return handleGetSettings(env);
}