// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

// Tracks which slugs currently have a live edge-cached redirect. When the
// redirect handler decides to cache a slug, it writes a marker with a TTL equal
// to the cache duration. The admin UI reads these markers to know which links
// are served from cache (and therefore under-count clicks), so it can flag the
// affected analytics as approximate. The `rc:` prefix cannot collide with a
// slug key because slugs never contain a colon.
const MARKER_PREFIX = "rc:";

// Cloudflare KV rejects TTLs shorter than 60 seconds.
const MIN_TTL_SECONDS = 60;

export class RedirectCacheMarker {
  /** Record that `slug` is edge-cached for the next `ttlSeconds`. */
  static async mark(kv: KVNamespace | undefined, slug: string, ttlSeconds: number): Promise<void> {
    if (!kv) return;
    const ttl = Math.max(MIN_TTL_SECONDS, Math.floor(ttlSeconds));
    await kv.put(MARKER_PREFIX + slug, "1", { expirationTtl: ttl });
  }

  /** Remove the marker for `slug` (e.g. after an explicit cache purge). */
  static async unmark(kv: KVNamespace | undefined, slug: string): Promise<void> {
    if (!kv) return;
    await kv.delete(MARKER_PREFIX + slug);
  }

  /** True when `slug` still has a live cached redirect marker. */
  static async isCached(kv: KVNamespace | undefined, slug: string): Promise<boolean> {
    if (!kv) return false;
    return (await kv.get(MARKER_PREFIX + slug)) !== null;
  }

  /** Remove every cache marker (used when the whole cache is purged). */
  static async clearAll(kv: KVNamespace | undefined): Promise<void> {
    if (!kv) return;
    let cursor: string | undefined;
    // KV list is paginated; walk every page so no marker is left behind.
    // eslint-disable-next-line no-constant-condition
    for (;;) {
      const res = await kv.list({ prefix: MARKER_PREFIX, cursor });
      await Promise.all(res.keys.map((k) => kv.delete(k.name)));
      if (res.list_complete) break;
      cursor = res.cursor;
    }
  }

  /**
   * Return the subset of `slugs` that currently have a live cache marker.
   * Reads run in parallel; an empty set is returned when KV is unavailable.
   */
  static async filterCached(kv: KVNamespace | undefined, slugs: string[]): Promise<Set<string>> {
    if (!kv || slugs.length === 0) return new Set();
    const unique = Array.from(new Set(slugs));
    const hits = await Promise.all(
      unique.map((slug) => kv.get(MARKER_PREFIX + slug).then((v) => (v !== null ? slug : null))),
    );
    return new Set(hits.filter((s): s is string => s !== null));
  }
}
