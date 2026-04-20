// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { FC } from "hono/jsx";

type DeltaProps = {
  pct: number;
  id?: string;
};

export const Delta: FC<DeltaProps> = ({ pct, id }) => {
  const dir = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  const icon = dir === "up" ? "trending_up" : dir === "down" ? "trending_down" : "trending_flat";
  const sign = pct > 0 ? "+" : "";
  return (
    <span class={`delta ${dir}`} id={id} data-delta={String(pct)}>
      <span class="icon">{icon}</span>
      <span class="delta-label">{sign}{pct}%</span>
    </span>
  );
};
