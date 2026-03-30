// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import {
  createApiKeyForUser,
  deleteApiKeyForUser,
  listApiKeysForUser,
} from "../services/admin-management";
import { json, fromServiceResult } from "./response";

export async function handleListKeys(env: Env, email: string): Promise<Response> {
  return fromServiceResult(await listApiKeysForUser(env, email));
}

export async function handleCreateKey(request: Request, env: Env, email: string): Promise<Response> {
  let body: { title?: string; scope?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  return fromServiceResult(await createApiKeyForUser(env, email, body));
}

export async function handleDeleteKey(env: Env, email: string, id: number): Promise<Response> {
  return fromServiceResult(await deleteApiKeyForUser(env, email, id));
}
