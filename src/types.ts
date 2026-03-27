// Copyright 2025 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

export interface Env {
  DB: D1Database;
  SLUG_DEFAULT_LENGTH: string;
}

export interface Link {
  id: number;
  url: string;
  label: string | null;
  created_at: number;
  expires_at: number | null;
}

export interface Slug {
  id: number;
  link_id: number;
  slug: string;
  is_vanity: number;
  click_count: number;
  created_at: number;
}

export interface LinkWithSlugs extends Link {
  slugs: Slug[];
  total_clicks: number;
}

export interface Click {
  id: number;
  slug_id: number;
  clicked_at: number;
  referrer: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
}

export interface ClickStats {
  total_clicks: number;
  countries: { name: string; count: number }[];
  referrers: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  clicks_over_time: { date: string; count: number }[];
}

export interface DashboardStats {
  total_links: number;
  total_clicks: number;
  recent_links: LinkWithSlugs[];
  top_links: (LinkWithSlugs & { total_clicks: number })[];
  top_countries: { name: string; count: number }[];
  top_referrers: { name: string; count: number }[];
}