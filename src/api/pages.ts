// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { Env, Page } from "../types";
import { PageRepository, SlugRepository } from "../db";
import { json } from "./response";

function contentTypeFromFilename(filename: string): string {
  const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : "";
  const map: Record<string, string> = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    csv: "text/csv; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    pdf: "application/pdf",
    wasm: "application/wasm",
    ics: "text/calendar; charset=utf-8",
    yaml: "text/yaml; charset=utf-8",
    yml: "text/yaml; charset=utf-8",
    toml: "text/plain; charset=utf-8",
    md: "text/markdown; charset=utf-8",
  };
  return map[ext || ""] || "application/octet-stream";
}

export function pageResponse(page: Page): Response {
  const ct = contentTypeFromFilename(page.filename);
  const headers = new Headers({ "Content-Type": ct });

  let customHeaders: Record<string, string> = {};
  try {
    customHeaders = JSON.parse(page.headers);
  } catch { /* ignore */ }
  for (const [k, v] of Object.entries(customHeaders)) {
    headers.set(k, v);
  }

  return new Response(page.content, {
    status: page.http_status,
    headers,
  });
}

export async function handleListPages(env: Env): Promise<Response> {
  const pages = await PageRepository.list(env.DB);
  return json(pages);
}

export async function handleCreatePage(request: Request, env: Env): Promise<Response> {
  let body: { slug?: string; content?: string; filename?: string; http_status?: number; headers?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.slug || !body.content || !body.filename) {
    return json({ error: "slug, content, and filename are required" }, 400);
  }

  const slug = body.slug.toLowerCase();
  if (slug.includes("/")) {
    return json({ error: "slug must not contain '/'" }, 400);
  }

  const existingRedirect = await SlugRepository.exists(env.DB, slug);
  if (existingRedirect) {
    return json({ error: "A redirect already uses this slug" }, 409);
  }

  const existingPage = await PageRepository.findBySlug(env.DB, slug);
  if (existingPage) {
    return json({ error: "A page already uses this slug" }, 409);
  }

  let headers = "{}";
  if (body.headers) {
    try {
      JSON.parse(body.headers);
      headers = body.headers;
    } catch {
      return json({ error: "headers must be valid JSON" }, 400);
    }
  }

  const httpStatus = body.http_status ?? 200;
  if (!Number.isInteger(httpStatus) || httpStatus < 100 || httpStatus > 599) {
    return json({ error: "http_status must be an integer between 100 and 599" }, 400);
  }

  const page = await PageRepository.create(env.DB, {
    slug,
    content: body.content,
    filename: body.filename,
    http_status: httpStatus,
    headers,
    created_by: "app",
  });

  return json(page, 201);
}

export async function handleUpdatePage(request: Request, env: Env, id: number): Promise<Response> {
  const existing = await PageRepository.findById(env.DB, id);
  if (!existing) return json({ error: "Not found" }, 404);

  let body: { slug?: string; content?: string; filename?: string; http_status?: number; headers?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (body.slug !== undefined) {
    const slug = body.slug.toLowerCase();
    if (slug.includes("/")) {
      return json({ error: "slug must not contain '/'" }, 400);
    }
    if (slug !== existing.slug) {
      const redirectConflict = await SlugRepository.exists(env.DB, slug);
      if (redirectConflict) {
        return json({ error: "A redirect already uses this slug" }, 409);
      }
      const pageConflict = await PageRepository.findBySlug(env.DB, slug);
      if (pageConflict && pageConflict.id !== id) {
        return json({ error: "Another page already uses this slug" }, 409);
      }
    }
  }

  if (body.headers !== undefined) {
    try {
      JSON.parse(body.headers);
    } catch {
      return json({ error: "headers must be valid JSON" }, 400);
    }
  }

  if (body.http_status !== undefined && (!Number.isInteger(body.http_status) || body.http_status < 100 || body.http_status > 599)) {
    return json({ error: "http_status must be an integer between 100 and 599" }, 400);
  }

  await PageRepository.update(env.DB, id, body);
  const updated = await PageRepository.findById(env.DB, id);
  return json(updated);
}

export async function handleDeletePage(env: Env, id: number): Promise<Response> {
  const existing = await PageRepository.findById(env.DB, id);
  if (!existing) return json({ error: "Not found" }, 404);

  await PageRepository.delete(env.DB, id);
  return json({ deleted: true });
}

export async function handleDisablePage(env: Env, id: number): Promise<Response> {
  const existing = await PageRepository.findById(env.DB, id);
  if (!existing) return json({ error: "Not found" }, 404);

  await PageRepository.disable(env.DB, id);
  const updated = await PageRepository.findById(env.DB, id);
  return json(updated);
}

export async function handleEnablePage(env: Env, id: number): Promise<Response> {
  const existing = await PageRepository.findById(env.DB, id);
  if (!existing) return json({ error: "Not found" }, 404);

  await PageRepository.enable(env.DB, id);
  const updated = await PageRepository.findById(env.DB, id);
  return json(updated);
}
