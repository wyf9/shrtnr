// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

export type ServiceResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function fromServiceResult<T>(result: ServiceResult<T>): Response {
  if (!result.ok) return json({ error: result.error }, result.status);
  return json(result.data, result.status);
}
