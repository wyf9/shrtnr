// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

// ---- Auth ----

export interface ApiKeyAuth {
  apiKey: string;
}

export type ShrtnrAuth = ApiKeyAuth;

export interface ShrtnrConfig {
  baseUrl: string;
  auth: ShrtnrAuth;
}

// ---- API Models ----

export interface Slug {
  link_id: number;
  slug: string;
  is_custom: number;
  is_primary: number;
  disabled_at: number | null;
  click_count: number;
  created_at: number;
}

export interface Link {
  id: number;
  url: string;
  label: string | null;
  created_at: number;
  expires_at: number | null;
  created_via: string | null;
  created_by: string;
  slugs: Slug[];
  total_clicks: number;
}

export interface ClickStats {
  total_clicks: number;
  countries: NameCount[];
  referrers: NameCount[];
  referrer_hosts: NameCount[];
  devices: NameCount[];
  os: NameCount[];
  browsers: NameCount[];
  link_modes: NameCount[];
  channels: NameCount[];
  clicks_over_time: DateCount[];
  slug_clicks: SlugCount[];
}

export interface SlugCount {
  slug: string;
  count: number;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface DateCount {
  date: string;
  count: number;
}

export type TimelineRange = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

export interface TimelineBucket {
  label: string;
  count: number;
}

export interface TimelineData {
  range: TimelineRange;
  buckets: TimelineBucket[];
  summary: {
    last_24h: number;
    last_7d: number;
    last_30d: number;
    last_90d: number;
    last_1y: number;
  };
}

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: number;
}

// ---- Request Bodies ----

export interface CreateLinkOptions {
  url: string;
  label?: string;
  slug_length?: number;
  expires_at?: number;
}

export interface UpdateLinkOptions {
  url?: string;
  label?: string | null;
  expires_at?: number | null;
}

// ---- Bundles ----

export type BundleAccent = "orange" | "red" | "green" | "blue" | "purple";

export interface Bundle {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  accent: BundleAccent;
  archived_at: number | null;
  created_via: string | null;
  created_by: string;
  created_at: number;
  updated_at: number;
}

export interface BundleWithSummary extends Bundle {
  link_count: number;
  total_clicks: number;
  delta_pct?: number;
  sparkline: number[];
  top_links: { slug: string; click_count: number }[];
}

export interface BundleStatsPerLink {
  link_id: number;
  label: string | null;
  primary_slug: string;
  url: string;
  click_count: number;
  pct_of_bundle: number;
  delta_pct?: number;
}

export interface BundleStats {
  bundle: Bundle;
  link_count: number;
  total_clicks: number;
  delta_pct?: number;
  clicked_links: number;
  top_performer?: { slug: string; label: string | null; click_count: number; pct_of_bundle: number };
  countries_reached: number;
  top_country?: { name: string; pct: number };
  timeline: TimelineData;
  countries: NameCount[];
  devices: NameCount[];
  os: NameCount[];
  browsers: NameCount[];
  referrers: NameCount[];
  link_modes: NameCount[];
  per_link: BundleStatsPerLink[];
}

export interface CreateBundleOptions {
  name: string;
  description?: string | null;
  icon?: string | null;
  accent?: BundleAccent;
}

export interface UpdateBundleOptions {
  name?: string;
  description?: string | null;
  icon?: string | null;
  accent?: BundleAccent;
}

export interface ListBundlesOptions {
  archived?: boolean;
}

