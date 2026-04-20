// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { FC } from "hono/jsx";

type SparklineProps = {
  values: number[];
  stroke?: string;
  fill?: string;
  viewBox?: string;
};

/**
 * Simple polyline sparkline. Renders nothing if values are empty or all zero.
 * Normalizes the series into the default 100x32 viewBox.
 */
export const Sparkline: FC<SparklineProps> = ({
  values,
  stroke = "var(--color-accent)",
  fill = "none",
  viewBox = "0 0 100 32",
}) => {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? 100 / (values.length - 1) : 0;
  const points = values
    .map((v, i) => `${(i * step).toFixed(2)},${(32 - (v / max) * 30 - 1).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill={fill} stroke={stroke} stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
    </svg>
  );
};
