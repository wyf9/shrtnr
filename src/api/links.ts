// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import { getAllLinks, getLinkById, createLink, updateLink, deleteLink, getSetting } from "../db";
import { generateUniqueSlug, validateVanitySlug, validateSlugLength } from "../slugs";
import { slugExists } from "../db";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleListLinks(env: Env): Promise<Response> {
  const links = await getAllLinks(env.DB);
  return json(links);
}

export async function handleGetLink(env: Env, id: number): Promise<Response> {
  const link = await getLinkById(env.DB, id);
  if (!link) return json({ error: "Link not found" }, 404);
  return json(link);
}

export async function handleCreateLink(request: Request, env: Env): Promise<Response> {
  let body: {
    url?: string;
    label?: string;
    slug_length?: number;
    vanity_slug?: string;
    expires_at?: number;
  };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.url || typeof body.url !== "string") {
    return json({ error: "url is required" }, 400);
  }

  try {
    new URL(body.url);
  } catch {
    return json({ error: "url must be a valid URL" }, 400);
  }

  // Determine slug length
  let slugLength: number;
  if (body.slug_length !== undefined) {
    slugLength = body.slug_length;
  } else {
    const dbDefault = await getSetting(env.DB, "slug_default_length");
    slugLength = parseInt(dbDefault ?? env.SLUG_DEFAULT_LENGTH, 10);
  }

  const lengthErr = validateSlugLength(slugLength);
  if (lengthErr) return json({ error: lengthErr }, 400);

  // Validate vanity slug if provided
  if (body.vanity_slug) {
    const vanityErr = validateVanitySlug(body.vanity_slug);
    if (vanityErr) return json({ error: vanityErr }, 400);

    if (await slugExists(env.DB, body.vanity_slug)) {
      return json({ error: "Vanity slug already exists" }, 409);
    }
  }

  // Generate unique random slug
  let slug: string;
  try {
    slug = await generateUniqueSlug(env.DB, slugLength);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }

  const link = await createLink(
    env.DB,
    body.url,
    slug,
    body.label,
    body.vanity_slug,
    body.expires_at
  );

  return json(link, 201);
}

export async function handleUpdateLink(request: Request, env: Env, id: number): Promise<Response> {
  let body: { url?: string; label?: string | null; expires_at?: number | null };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.url !== undefined) {
    try {
      new URL(body.url);
    } catch {
      return json({ error: "url must be a valid URL" }, 400);
    }
  }

  const link = await updateLink(env.DB, id, body);
  if (!link) return json({ error: "Link not found" }, 404);

  return json(link);
}

export async function handleDeleteLink(env: Env, id: number): Promise<Response> {
  const deleted = await deleteLink(env.DB, id);
  if (!deleted) return json({ error: "Link not found" }, 404);
  return json({ success: true });
}