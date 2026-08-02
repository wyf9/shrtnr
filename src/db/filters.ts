// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

/**
 * Per-query filters resolved from the caller's settings. Both flags default to
 * undefined (no filter) so low-level callers and tests keep their raw
 * semantics; service-layer callers resolve them from user settings so
 * dashboards honor toggles.
 */
export type ClickFilters = {
  excludeBots?: boolean;
  excludeSelfReferrers?: boolean;
  excludeAiSearches?: boolean;
};

/**
 * SQL fragment like ` AND is_bot = 0 AND is_self_referrer = 0`, or empty.
 * Pass `alias` when the clicks table is joined with an alias.
 */
export function clickFilterSql(filters?: ClickFilters, alias = ""): string {
  const prefix = alias ? `${alias}.` : "";
  const parts: string[] = [];
  if (filters?.excludeBots) parts.push(`${prefix}is_bot = 0`);
  if (filters?.excludeSelfReferrers)
    parts.push(`${prefix}is_self_referrer = 0`);
  if (filters?.excludeAiSearches) parts.push(`${prefix}is_ai_search = 0`);
  return parts.length ? " AND " + parts.join(" AND ") : "";
}

/**
 * Options for the per-slug click_count subquery used by Link and Slug
 * repositories. Callers that want raw lifetime counts (slug deletion guards,
 * redirect resolution) pass nothing.
 */
export interface SlugClickCountOptions {
  filters?: ClickFilters;
  sinceTs?: number;
}

/**
 * Builds a parameterized SELECT-clause subquery for per-slug click counts plus
 * the bind arguments to pass alongside the outer query. Callers must spread the
 * returned `binds` into their .bind(...) calls AFTER their own binds.
 */
export function slugClickCountSql(opts?: SlugClickCountOptions): {
  sql: string;
  binds: number[];
} {
  let sql = "(SELECT COUNT(*) FROM clicks c WHERE c.slug = s.slug";
  sql += clickFilterSql(opts?.filters, "c");
  const binds: number[] = [];
  if (opts?.sinceTs !== undefined) {
    sql += " AND c.clicked_at >= ?";
    binds.push(Math.floor(opts.sinceTs));
  }
  return { sql: sql + ") AS click_count", binds };
}
