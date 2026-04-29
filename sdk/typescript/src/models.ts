// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

// ---- Enums ----

export type TimelineRange = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

export type BundleAccent = "orange" | "red" | "green" | "blue" | "purple";

// ---- Core models ----

export interface Slug {
  linkId: number;
  slug: string;
  isCustom: number;
  isPrimary: number;
  clickCount: number;
  createdAt: number;
  disabledAt: number | null;
}

export interface Link {
  id: number;
  url: string;
  label: string | null;
  createdAt: number;
  expiresAt: number | null;
  createdVia: string | null;
  createdBy: string;
  slugs: Slug[];
  totalClicks: number;
  deltaPct?: number;
}

export interface Bundle {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  accent: BundleAccent;
  archivedAt: number | null;
  createdVia: string | null;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface BundleWithSummary extends Bundle {
  linkCount: number;
  totalClicks: number;
  deltaPct?: number;
  sparkline: number[];
  topLinks: { slug: string; clickCount: number }[];
}

// ---- Analytics models ----

export interface NameCount {
  name: string;
  count: number;
}

export interface ClickStats {
  totalClicks: number;
  countries: NameCount[];
  referrers: NameCount[];
  referrerHosts: NameCount[];
  devices: NameCount[];
  os: NameCount[];
  browsers: NameCount[];
  linkModes: NameCount[];
  channels: NameCount[];
  clicksOverTime: { date: string; count: number }[];
  slugClicks: { slug: string; count: number }[];
  numCountries: number;
  numReferrers: number;
  numReferrerHosts: number;
  numOs: number;
  numBrowsers: number;
}

export interface TimelineBucket {
  label: string;
  count: number;
}

export interface TimelineData {
  range: TimelineRange;
  buckets: TimelineBucket[];
  summary: {
    last24h: number;
    last7d: number;
    last30d: number;
    last90d: number;
    last1y: number;
  };
}

// ---- Request body types ----

export interface CreateLinkBody {
  url: string;
  label?: string;
  slugLength?: number;
  expiresAt?: number;
  allowDuplicate?: boolean;
}

export interface UpdateLinkBody {
  url?: string;
  label?: string | null;
  expiresAt?: number | null;
}

export interface AddSlugBody {
  slug: string;
}

export interface CreateBundleBody {
  name: string;
  description?: string | null;
  icon?: string | null;
  accent?: BundleAccent;
}

export interface UpdateBundleBody {
  name?: string;
  description?: string | null;
  icon?: string | null;
  accent?: BundleAccent;
}
