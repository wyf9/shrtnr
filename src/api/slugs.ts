// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import { getLinkById, addVanitySlug, removeVanitySlug, slugExists } from "../db";
import { validateVanitySlug } from "../slugs";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleAddVanitySlug(
  request: Request,
  env: Env,
  linkId: number
): Promise<Response> {
  const link = await getLinkById(env.DB, linkId);
  if (!link) return json({ error: "Link not found" }, 404);

  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.slug || typeof body.slug !== "string") {
    return json({ error: "slug is required" }, 400);
  }

  const err = validateVanitySlug(body.slug);
  if (err) return json({ error: err }, 400);

  if (await slugExists(env.DB, body.slug)) {
    return json({ error: "Slug already exists" }, 409);
  }

  const slug = await addVanitySlug(env.DB, linkId, body.slug);
  return json(slug, 201);
}

export async function handleRemoveVanitySlug(
  env: Env,
  linkId: number,
  slug: string
): Promise<Response> {
  const link = await getLinkById(env.DB, linkId);
  if (!link) return json({ error: "Link not found" }, 404);

  const removed = await removeVanitySlug(env.DB, linkId, slug);
  if (!removed) {
    return json({ error: "Vanity slug not found or cannot remove primary slug" }, 404);
  }

  return json({ success: true });
}