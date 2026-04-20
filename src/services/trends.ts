// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { TimelineRange } from "../types";

export const RANGE_SECONDS: Record<Exclude<TimelineRange, "all">, number> = {
  "24h": 86400,
  "7d": 7 * 86400,
  "30d": 30 * 86400,
  "90d": 90 * 86400,
  "1y": 365 * 86400,
};

/**
 * Percent change from previous to current, rounded to nearest integer.
 * - Both zero: 0
 * - Previous zero and current positive: 100
 * - Previous zero and current negative: -100
 */
export function computeDelta(current: number, previous: number): number {
  if (current === previous) return 0;
  if (previous === 0) return current > 0 ? 100 : -100;
  return Math.round(((current - previous) / previous) * 100);
}
