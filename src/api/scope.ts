// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "./hono-env";
import { hasScope, forbiddenResponse } from "../auth";

export function requireScope(scope: "read" | "create"): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    if (!hasScope(c.var.auth, scope)) return forbiddenResponse();
    await next();
  };
}
