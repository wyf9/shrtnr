// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { ClickStats, DashboardStats } from "../types";
import { LinkRepository } from "./link-repository";

export class ClickRepository {
  static async record(
    db: D1Database,
    slugId: number,
    referrer: string | null,
    country: string | null,
    deviceType: string | null,
    browser: string | null,
    channel?: string | null,
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const ch = channel ?? "direct";
    const counterCol = ch === "qr" ? "qr_click_count" : "link_click_count";
    await Promise.all([
      db
        .prepare("INSERT INTO clicks (slug_id, clicked_at, referrer, country, device_type, browser, channel) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(slugId, now, referrer, country, deviceType, browser, ch)
        .run(),
      db
        .prepare(`UPDATE slugs SET ${counterCol} = ${counterCol} + 1 WHERE id = ?`)
        .bind(slugId)
        .run(),
    ]);
  }

  static async getStats(db: D1Database, linkId: number): Promise<ClickStats> {
    const slugIds = await db
      .prepare("SELECT id FROM slugs WHERE link_id = ?")
      .bind(linkId)
      .all<{ id: number }>();
    const ids = (slugIds.results ?? []).map((r) => r.id);

    if (ids.length === 0) {
      return { total_clicks: 0, countries: [], referrers: [], devices: [], browsers: [], channels: [], clicks_over_time: [] };
    }

    const placeholders = ids.map(() => "?").join(",");

    const [totalRow, countries, referrers, devices, browsers, channels, timeline] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as cnt FROM clicks WHERE slug_id IN (${placeholders})`).bind(...ids).first<{ cnt: number }>(),
      db.prepare(`SELECT country as name, COUNT(*) as count FROM clicks WHERE slug_id IN (${placeholders}) AND country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 10`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT referrer as name, COUNT(*) as count FROM clicks WHERE slug_id IN (${placeholders}) AND referrer IS NOT NULL GROUP BY referrer ORDER BY count DESC LIMIT 10`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT device_type as name, COUNT(*) as count FROM clicks WHERE slug_id IN (${placeholders}) AND device_type IS NOT NULL GROUP BY device_type ORDER BY count DESC`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT browser as name, COUNT(*) as count FROM clicks WHERE slug_id IN (${placeholders}) AND browser IS NOT NULL GROUP BY browser ORDER BY count DESC LIMIT 10`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT channel as name, COUNT(*) as count FROM clicks WHERE slug_id IN (${placeholders}) GROUP BY channel ORDER BY count DESC`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT date(clicked_at, 'unixepoch') as date, COUNT(*) as count FROM clicks WHERE slug_id IN (${placeholders}) GROUP BY date ORDER BY date DESC LIMIT 30`).bind(...ids).all<{ date: string; count: number }>(),
    ]);

    return {
      total_clicks: totalRow?.cnt ?? 0,
      countries: countries.results ?? [],
      referrers: referrers.results ?? [],
      devices: devices.results ?? [],
      browsers: browsers.results ?? [],
      channels: channels.results ?? [],
      clicks_over_time: (timeline.results ?? []).reverse(),
    };
  }

  static async getDashboardStats(db: D1Database): Promise<DashboardStats> {
    const [linkCount, clickCount, recentLinks, topCountries, topReferrers] = await Promise.all([
      db.prepare("SELECT COUNT(*) as cnt FROM links").first<{ cnt: number }>(),
      db.prepare("SELECT COUNT(*) as cnt FROM clicks").first<{ cnt: number }>(),
      LinkRepository.list(db),
      db.prepare("SELECT country as name, COUNT(*) as count FROM clicks WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 5").all<{ name: string; count: number }>(),
      db.prepare("SELECT referrer as name, COUNT(*) as count FROM clicks WHERE referrer IS NOT NULL GROUP BY referrer ORDER BY count DESC LIMIT 5").all<{ name: string; count: number }>(),
    ]);

    const sorted = [...recentLinks].sort((a, b) => b.total_clicks - a.total_clicks);

    return {
      total_links: linkCount?.cnt ?? 0,
      total_clicks: clickCount?.cnt ?? 0,
      recent_links: recentLinks.slice(0, 5),
      top_links: sorted.slice(0, 5),
      top_countries: topCountries.results ?? [],
      top_referrers: topReferrers.results ?? [],
    };
  }
}
