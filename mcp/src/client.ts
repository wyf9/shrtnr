// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

// ---- Types ----

export interface Slug {
  id: number;
  link_id: number;
  slug: string;
  is_vanity: number;
  click_count: number;
  created_at: number;
}

export interface Link {
  id: number;
  url: string;
  label: string | null;
  created_at: number;
  expires_at: number | null;
  slugs: Slug[];
  total_clicks: number;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface DateCount {
  date: string;
  count: number;
}

export interface ClickStats {
  total_clicks: number;
  countries: NameCount[];
  referrers: NameCount[];
  devices: NameCount[];
  browsers: NameCount[];
  clicks_over_time: DateCount[];
}

export interface HealthStatus {
  status: string;
  version: string;
  timestamp: number;
}

export interface CreateLinkOptions {
  url: string;
  label?: string;
  slug_length?: number;
  vanity_slug?: string;
  expires_at?: number;
}

export interface UpdateLinkOptions {
  url?: string;
  label?: string | null;
  expires_at?: number | null;
}

// ---- Error ----

export class ShrtnrApiError extends Error {
  public readonly status: number;

  constructor(status: number, body: unknown) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: string }).error)
        : `HTTP ${status}`;
    super(message);
    this.name = "ShrtnrApiError";
    this.status = status;
  }
}

// ---- Client ----

export class ShrtnrHttpClient {
  private readonly baseUrl: string;
  private readonly authHeader: Record<string, string>;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.authHeader = { Authorization: `Bearer ${apiKey}` };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method,
      headers: {
        ...this.authHeader,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      let parsed: unknown;
      try {
        parsed = await res.json();
      } catch {
        parsed = null;
      }
      throw new ShrtnrApiError(res.status, parsed);
    }
    return res.json() as Promise<T>;
  }

  health() {
    return this.request<HealthStatus>("GET", "/_/health");
  }

  listLinks() {
    return this.request<Link[]>("GET", "/_/api/links");
  }

  getLink(id: number) {
    return this.request<Link>("GET", `/_/api/links/${id}`);
  }

  createLink(opts: CreateLinkOptions) {
    return this.request<Link>("POST", "/_/api/links", opts);
  }

  updateLink(id: number, opts: UpdateLinkOptions) {
    return this.request<Link>("PUT", `/_/api/links/${id}`, opts);
  }

  disableLink(id: number) {
    return this.request<Link>("POST", `/_/api/links/${id}/disable`);
  }

  addVanitySlug(id: number, slug: string) {
    return this.request<Slug>("POST", `/_/api/links/${id}/slugs`, { slug });
  }

  getLinkAnalytics(id: number) {
    return this.request<ClickStats>("GET", `/_/api/links/${id}/analytics`);
  }
}
