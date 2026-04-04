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
    await db
      .prepare("INSERT INTO slugs (link_id, slug, is_vanity, click_count, created_at) VALUES (?, ?, 1, 0, ?)")
      .bind(linkId, slug, now)
      .run();

    return (await db
      .prepare("SELECT * FROM slugs WHERE link_id = ? AND slug = ?")
      .bind(linkId, slug)
      .first<Slug>())!;
  }
}
