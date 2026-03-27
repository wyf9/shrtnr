// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

export function handleHealth(): Response {
  return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
    headers: { "Content-Type": "application/json" },
  });
}