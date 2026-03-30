// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Env } from "../types";
import {
  getManagedDashboardStats,
  getManagedLinkAnalytics,
} from "../services/link-management";
import { fromServiceResult } from "./response";

export async function handleDashboardStats(env: Env): Promise<Response> {
  return fromServiceResult(await getManagedDashboardStats(env));
}

export async function handleLinkAnalytics(env: Env, linkId: number): Promise<Response> {
  return fromServiceResult(await getManagedLinkAnalytics(env, linkId));
}
