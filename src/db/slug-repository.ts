// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Slug } from "../types";

export class SlugRepository {
  static async findByValue(
    db: D1Database,
    slug: string,
  ): Promise<(Slug & { url: string; expires_at: number | null }) | null> {
    return db
      .prepare("SELECT s.*, l.url, l.expires_at FROM slugs s JOIN links l ON s.link_id = l.id WHERE s.slug = ?")
      .bind(slug)
      .first<Slug & { url: string; expires_at: number | null }>();
  }

  static async exists(db: D1Database, slug: string): Promise<boolean> {
    const row = await db.prepare("SELECT 1 FROM slugs WHERE slug = ?").bind(slug).first();
    return row !== null;
  }

  static async addVanity(db: D1Database, linkId: number, slug: string): Promise<Slug> {
    const now = Math.floor(Date.now() / 1000);

    // Check if this is the first vanity slug for the link
    const existingVanity = await db
      .prepare("SELECT 1 FROM slugs WHERE link_id = ? AND is_vanity = 1")
      .bind(linkId)
      .first();
    const isFirstVanity = !existingVanity;

    await db
      .prepare("INSERT INTO slugs (link_id, slug, is_vanity, is_primary, click_count, created_at) VALUES (?, ?, 1, ?, 0, ?)")
      .bind(linkId, slug, isFirstVanity ? 1 : 0, now)
      .run();

    // If first vanity slug, clear primary from all other slugs on this link
    if (isFirstVanity) {
      await db
        .prepare("UPDATE slugs SET is_primary = 0 WHERE link_id = ? AND slug != ?")
        .bind(linkId, slug)
        .run();
    }

    return (await db
      .prepare("SELECT * FROM slugs WHERE link_id = ? AND slug = ?")
      .bind(linkId, slug)
      .first<Slug>())!;
  }

  static async setPrimary(db: D1Database, linkId: number, slugId: number): Promise<void> {
    await db.prepare("UPDATE slugs SET is_primary = 0 WHERE link_id = ?").bind(linkId).run();
    await db.prepare("UPDATE slugs SET is_primary = 1 WHERE id = ? AND link_id = ?").bind(slugId, linkId).run();
  }

  static async disable(db: D1Database, slugId: number): Promise<Slug | null> {
    const now = Math.floor(Date.now() / 1000);
    const slug = await db.prepare("SELECT * FROM slugs WHERE id = ?").bind(slugId).first<Slug>();
    if (!slug) return null;

    await db.prepare("UPDATE slugs SET disabled_at = ? WHERE id = ?").bind(now, slugId).run();

    // If disabling the primary, fall back to the random slug
    if (slug.is_primary) {
      await db.prepare("UPDATE slugs SET is_primary = 0 WHERE id = ?").bind(slugId).run();
      await db
        .prepare("UPDATE slugs SET is_primary = 1 WHERE link_id = ? AND is_vanity = 0")
        .bind(slug.link_id)
        .run();
    }

    return db.prepare("SELECT * FROM slugs WHERE id = ?").bind(slugId).first<Slug>();
  }

  static async enable(db: D1Database, slugId: number): Promise<Slug | null> {
    await db.prepare("UPDATE slugs SET disabled_at = NULL WHERE id = ?").bind(slugId).run();
    return db.prepare("SELECT * FROM slugs WHERE id = ?").bind(slugId).first<Slug>();
  }

  static async remove(db: D1Database, slugId: number): Promise<boolean> {
    const slug = await db.prepare("SELECT * FROM slugs WHERE id = ?").bind(slugId).first<Slug>();
    if (!slug) return false;

    // Cannot delete random slugs
    if (!slug.is_vanity) return false;

    // Cannot delete slugs with clicks
    if (slug.click_count > 0) return false;

    // If removing the primary, fall back to random slug first
    if (slug.is_primary) {
      await db
        .prepare("UPDATE slugs SET is_primary = 1 WHERE link_id = ? AND is_vanity = 0")
        .bind(slug.link_id)
        .run();
    }

    await db.prepare("DELETE FROM slugs WHERE id = ?").bind(slugId).run();
    return true;
  }
}
