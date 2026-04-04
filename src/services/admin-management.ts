// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { ApiKeyRepository, SettingRepository } from "../db";
import type { ApiKeyRow } from "../db";
import { DEFAULT_SLUG_LENGTH } from "../constants";
import { validateSlugLength } from "../slugs";
import { Env } from "../types";
import { ServiceResult, ok, fail } from "./result";

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

export async function getAppSettings(
  env: Env,
  identity: string,
): Promise<ServiceResult<{ slug_default_length: number; theme: string | null; lang: string | null }>> {
  const [slugLength, theme, lang] = await Promise.all([
    SettingRepository.get(env.DB, identity, "slug_default_length"),
    SettingRepository.get(env.DB, identity, "theme"),
    SettingRepository.get(env.DB, identity, "lang"),
  ]);
  return ok({
    slug_default_length: parseInt(slugLength ?? String(DEFAULT_SLUG_LENGTH), 10),
    theme: theme ?? null,
    lang: lang ?? null,
  });
}

export async function updateAppSettings(
  env: Env,
  identity: string,
  body: { slug_default_length?: number; theme?: string; lang?: string },
): Promise<ServiceResult<{ slug_default_length: number; theme: string | null; lang: string | null }>> {
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

  return getAppSettings(env, identity);
}
