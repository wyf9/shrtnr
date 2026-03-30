// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import {
  createManagedLink,
  disableManagedLink,
  getManagedLink,
  listManagedLinks,
  updateManagedLink,
} from "../services/link-management";
import { json, fromServiceResult } from "./response";

export async function handleListLinks(env: Env): Promise<Response> {
  return fromServiceResult(await listManagedLinks(env));
}

export async function handleGetLink(env: Env, id: number): Promise<Response> {
  return fromServiceResult(await getManagedLink(env, id));
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

  return fromServiceResult(await createManagedLink(env, body));
}

export async function handleUpdateLink(request: Request, env: Env, id: number): Promise<Response> {
  let body: { url?: string; label?: string | null; expires_at?: number | null };

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  return fromServiceResult(await updateManagedLink(env, id, body));
}

export async function handleDisableLink(env: Env, id: number): Promise<Response> {
  return fromServiceResult(await disableManagedLink(env, id));
}
