// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

export interface ApiKeyRow {
  id: number;
  identity: string;
  title: string;
  key_prefix: string;
  key_hash: string;
  scope: string;
  created_at: number;
  last_used_at: number | null;
}

export class ApiKeyRepository {
  static async create(
    db: D1Database,
    data: {
      identity: string;
      title: string;
      keyPrefix: string;
      keyHash: string;
      scope: string;
    },
  ): Promise<ApiKeyRow> {
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare("INSERT INTO api_keys (identity, title, key_prefix, key_hash, scope, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(data.identity, data.title, data.keyPrefix, data.keyHash, data.scope, now)
      .run();

    return (await db
      .prepare("SELECT * FROM api_keys WHERE key_hash = ?")
      .bind(data.keyHash)
      .first<ApiKeyRow>())!;
  }

  static async list(db: D1Database, identity: string): Promise<ApiKeyRow[]> {
    const { results } = await db
      .prepare("SELECT * FROM api_keys WHERE identity = ? ORDER BY created_at DESC")
      .bind(identity)
      .all<ApiKeyRow>();
    return results ?? [];
  }

  static async delete(db: D1Database, identity: string, id: number): Promise<boolean> {
    const result = await db
      .prepare("DELETE FROM api_keys WHERE id = ? AND identity = ?")
      .bind(id, identity)
      .run();
    return (result.meta.changes ?? 0) > 0;
  }

  static async findByHash(db: D1Database, keyHash: string): Promise<ApiKeyRow | null> {
    return db
      .prepare("SELECT * FROM api_keys WHERE key_hash = ?")
      .bind(keyHash)
      .first<ApiKeyRow>();
  }

  static async updateLastUsed(db: D1Database, id: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await db.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?").bind(now, id).run();
  }
}
