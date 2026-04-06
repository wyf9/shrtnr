// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { ClickData, ClickStats, DashboardStats } from "../types";
import { LinkRepository } from "./link-repository";

export class ClickRepository {
  static async record(
    db: D1Database,
    slugId: number,
    data: ClickData = {},
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const mode = data.linkMode ?? "link";
    const counterCol = mode === "qr" ? "qr_click_count" : "link_click_count";
    await Promise.all([
      db
        .prepare(
          `INSERT INTO clicks (slug_id, clicked_at, referrer, referrer_host, country, region, city, device_type, os, browser, language, link_mode, channel, utm_source, utm_medium, utm_campaign, utm_term, utm_content, user_agent, is_bot)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          slugId,
          now,
          data.referrer ?? null,
          data.referrerHost ?? null,
          data.country ?? null,
          data.region ?? null,
          data.city ?? null,
          data.deviceType ?? null,
          data.os ?? null,
          data.browser ?? null,
          data.language ?? null,
          mode,
          data.channel ?? null,
          data.utmSource ?? null,
          data.utmMedium ?? null,
          data.utmCampaign ?? null,
          data.utmTerm ?? null,
          data.utmContent ?? null,
          data.userAgent ?? null,
          data.isBot ?? 0,
        )
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

    const empty: ClickStats = { total_clicks: 0, countries: [], referrers: [], referrer_hosts: [], devices: [], os: [], browsers: [], link_modes: [], channels: [], clicks_over_time: [] };
    if (ids.length === 0) return empty;

    const placeholders = ids.map(() => "?").join(",");
    const where = `slug_id IN (${placeholders})`;

    const [totalRow, countries, referrers, referrerHosts, devices, osList, browsers, linkModes, channels, timeline] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as cnt FROM clicks WHERE ${where}`).bind(...ids).first<{ cnt: number }>(),
      db.prepare(`SELECT country as name, COUNT(*) as count FROM clicks WHERE ${where} AND country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 10`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT referrer as name, COUNT(*) as count FROM clicks WHERE ${where} AND referrer IS NOT NULL GROUP BY referrer ORDER BY count DESC LIMIT 10`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT referrer_host as name, COUNT(*) as count FROM clicks WHERE ${where} AND referrer_host IS NOT NULL GROUP BY referrer_host ORDER BY count DESC LIMIT 10`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT device_type as name, COUNT(*) as count FROM clicks WHERE ${where} AND device_type IS NOT NULL GROUP BY device_type ORDER BY count DESC`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT os as name, COUNT(*) as count FROM clicks WHERE ${where} AND os IS NOT NULL GROUP BY os ORDER BY count DESC LIMIT 10`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT browser as name, COUNT(*) as count FROM clicks WHERE ${where} AND browser IS NOT NULL GROUP BY browser ORDER BY count DESC LIMIT 10`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT link_mode as name, COUNT(*) as count FROM clicks WHERE ${where} GROUP BY link_mode ORDER BY count DESC`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT channel as name, COUNT(*) as count FROM clicks WHERE ${where} AND channel IS NOT NULL GROUP BY channel ORDER BY count DESC`).bind(...ids).all<{ name: string; count: number }>(),
      db.prepare(`SELECT date(clicked_at, 'unixepoch') as date, COUNT(*) as count FROM clicks WHERE ${where} GROUP BY date ORDER BY date DESC LIMIT 30`).bind(...ids).all<{ date: string; count: number }>(),
    ]);

    return {
      total_clicks: totalRow?.cnt ?? 0,
      countries: countries.results ?? [],
      referrers: referrers.results ?? [],
      referrer_hosts: referrerHosts.results ?? [],
      devices: devices.results ?? [],
      os: osList.results ?? [],
      browsers: browsers.results ?? [],
      link_modes: linkModes.results ?? [],
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
