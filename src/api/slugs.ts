// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import { addVanitySlugToLink } from "../services/link-management";
import { json, fromServiceResult } from "./response";

export async function handleAddVanitySlug(
  request: Request,
  env: Env,
  linkId: number
): Promise<Response> {
  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  return fromServiceResult(await addVanitySlugToLink(env, linkId, body));
}
