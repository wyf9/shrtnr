// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { Page } from "../types";

export class PageRepository {
  static async list(db: D1Database): Promise<Page[]> {
    const result = await db
      .prepare("SELECT * FROM pages ORDER BY created_at DESC")
      .all<Page>();
    return result.results;
  }

  static async findBySlug(db: D1Database, slug: string): Promise<Page | null> {
    return db
      .prepare("SELECT * FROM pages WHERE slug = ?")
      .bind(slug)
      .first<Page>();
  }

  static async findById(db: D1Database, id: number): Promise<Page | null> {
    return db
      .prepare("SELECT * FROM pages WHERE id = ?")
      .bind(id)
      .first<Page>();
  }

  static async create(
    db: D1Database,
    input: {
      slug: string;
      content: string;
      filename: string;
      http_status: number;
      headers: string;
      created_by: string;
    },
  ): Promise<Page> {
    const now = Math.floor(Date.now() / 1000);
    const result = await db
      .prepare(
        "INSERT INTO pages (slug, content, filename, http_status, headers, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        input.slug,
        input.content,
        input.filename,
        input.http_status,
        input.headers,
        now,
        now,
        input.created_by,
      )
      .run();
    return {
      id: result.meta.last_row_id as number,
      slug: input.slug,
      content: input.content,
      filename: input.filename,
      http_status: input.http_status,
      headers: input.headers,
      created_at: now,
      updated_at: now,
      created_by: input.created_by,
      disabled_at: null,
    };
  }

  static async update(
    db: D1Database,
    id: number,
    input: {
      slug?: string;
      content?: string;
      filename?: string;
      http_status?: number;
      headers?: string;
    },
  ): Promise<boolean> {
    const sets: string[] = [];
    const params: (string | number)[] = [];

    if (input.slug !== undefined) {
      sets.push("slug = ?");
      params.push(input.slug);
    }
    if (input.content !== undefined) {
      sets.push("content = ?");
      params.push(input.content);
    }
    if (input.filename !== undefined) {
      sets.push("filename = ?");
      params.push(input.filename);
    }
    if (input.http_status !== undefined) {
      sets.push("http_status = ?");
      params.push(input.http_status);
    }
    if (input.headers !== undefined) {
      sets.push("headers = ?");
      params.push(input.headers);
    }

    if (sets.length === 0) return false;

    sets.push("updated_at = ?");
    params.push(Math.floor(Date.now() / 1000));
    params.push(id);

    const result = await db
      .prepare(`UPDATE pages SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();
    return result.meta.changes > 0;
  }

  static async delete(db: D1Database, id: number): Promise<boolean> {
    const result = await db
      .prepare("DELETE FROM pages WHERE id = ?")
      .bind(id)
      .run();
    return result.meta.changes > 0;
  }

  static async disable(db: D1Database, id: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await db
      .prepare("UPDATE pages SET disabled_at = ?, updated_at = ? WHERE id = ?")
      .bind(now, now, id)
      .run();
    return result.meta.changes > 0;
  }

  static async enable(db: D1Database, id: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const result = await db
      .prepare("UPDATE pages SET disabled_at = NULL, updated_at = ? WHERE id = ?")
      .bind(now, id)
      .run();
    return result.meta.changes > 0;
  }
}
