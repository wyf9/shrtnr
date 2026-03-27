// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import { getDashboardStats, getLinkClickStats } from "../db";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleDashboardStats(env: Env): Promise<Response> {
  const stats = await getDashboardStats(env.DB);
  return json(stats);
}

export async function handleLinkAnalytics(env: Env, linkId: number): Promise<Response> {
  const stats = await getLinkClickStats(env.DB, linkId);
  return json(stats);
}
