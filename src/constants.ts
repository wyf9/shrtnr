// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

export const MIN_SLUG_LENGTH = 3;
export const DEFAULT_SLUG_LENGTH = MIN_SLUG_LENGTH;

// Above this slug length the number of possible combinations becomes
// astronomically large and would overflow the settings hint area, so the UI
// shows an "infinite" label instead of the exact count.
export const SLUG_COMBO_INFINITE_THRESHOLD = 25;

// Shared Workers Cache tag applied to every cached redirect response, in
// addition to the per-slug `redirect:<slug>` tag. Purging this one tag drops
// all cached redirects at once (used when the redirect cache is disabled).
export const REDIRECT_CACHE_TAG = "redirect";

/** Per-slug cache tag for a cached redirect response. */
export function redirectCacheTag(slug: string): string {
  return `${REDIRECT_CACHE_TAG}:${slug.toLowerCase()}`;
}
