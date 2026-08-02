import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { SELF } from "cloudflare:test";
import { applyMigrations, resetData } from "../setup";

function req(path: string): Request {
  return new Request(`https://shrtnr.test${path}`);
}

function inputTag(html: string, id: string): string {
  return html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] ?? "";
}

beforeAll(applyMigrations);
beforeEach(resetData);

describe("Settings page MCP status", () => {
  it("renders the MCP status section", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("MCP Server");
  });

  it("shows not-configured status when secrets are missing", async () => {
    // Test env has no ACCESS_CLIENT_ID etc., so MCP should show as not configured
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    expect(html).toContain("Not configured");
    expect(html).toContain("README");
  });
});

describe("Settings page default range control", () => {
  it("renders the default-range picker with all options", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    expect(html).toContain('id="default-range-picker"');
    for (const v of ["24h", "7d", "30d", "90d", "1y", "all"]) {
      expect(html).toContain(`value="${v}"`);
    }
  });

  it("does not offer an empty 'unset' option", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    expect(html).not.toMatch(/<option value=""/);
  });

  it("selects 30d by default when no preference is stored", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    expect(html).toMatch(/<option value="30d"[^>]*selected/);
  });
});

describe("Settings page analytics filter toggles", () => {
  it("renders the filter-bots and filter-self-referrers toggles", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    expect(html).toContain('id="filter-bots-toggle"');
    expect(html).toContain('id="filter-self-referrers-toggle"');
  });

  it("both toggles are checked by default (defaults to filtering enabled)", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    // Each input exists with `checked` in the rendered markup when enabled.
    expect(html).toMatch(/id="filter-bots-toggle"[^>]*checked/);
    expect(html).toMatch(/id="filter-self-referrers-toggle"[^>]*checked/);
  });
});

describe("Settings page redirect cache toggle", () => {
  it("renders the redirect cache toggle unchecked by default", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    expect(html).toContain('id="redirect-cache-toggle"');
    expect(inputTag(html, "redirect-cache-toggle")).not.toMatch(
      /\schecked(?:=|\s|\/?>)/,
    );
  });

  it("checks the redirect cache toggle when enabled", async () => {
    await SELF.fetch(
      new Request("https://shrtnr.test/_/admin/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirect_cache_enabled: true }),
      }),
    );
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    expect(inputTag(html, "redirect-cache-toggle")).toMatch(
      /\schecked(?:=|\s|\/?>)/,
    );
  });
});

describe("Dashboard redirect cache warning", () => {
  it("does not render the analytics warning by default", async () => {
    const res = await SELF.fetch(req("/_/admin/dashboard"));
    const html = await res.text();
    expect(html).not.toContain('id="redirect-cache-analytics-warning"');
  });

  it("renders the analytics warning when redirect cache is enabled", async () => {
    await SELF.fetch(
      new Request("https://shrtnr.test/_/admin/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirect_cache_enabled: true }),
      }),
    );
    const res = await SELF.fetch(req("/_/admin/dashboard"));
    const html = await res.text();
    expect(html).toContain('id="redirect-cache-analytics-warning"');
    expect(html).toContain("Analytics can undercount clicks");
  });
});

function comboHint(html: string): string {
  return html.match(/id="slug-combo-hint"[^>]*>([^<]*)</)?.[1] ?? "";
}

describe("Settings page slug length combinations hint", () => {
  it("shows the exact combination count for the default slug length", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    const hint = comboHint(await res.text());
    expect(hint).toContain("possible combinations");
    expect(hint).not.toContain("infinite");
  });

  it("shows an 'infinite' hint when the stored slug length exceeds 25", async () => {
    await SELF.fetch(
      new Request("https://shrtnr.test/_/admin/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug_default_length: 30 }),
      }),
    );
    const res = await SELF.fetch(req("/_/admin/settings"));
    const hint = comboHint(await res.text());
    expect(hint).toBe("Practically infinite possible combinations");
  });

  it("still shows the exact count at the 25 boundary", async () => {
    await SELF.fetch(
      new Request("https://shrtnr.test/_/admin/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug_default_length: 25 }),
      }),
    );
    const res = await SELF.fetch(req("/_/admin/settings"));
    const hint = comboHint(await res.text());
    expect(hint).not.toContain("infinite");
    expect(hint).toContain("possible combinations");
  });
});

describe("Settings page language control", () => {
  it("offers Simplified Chinese as a language option", async () => {
    const res = await SELF.fetch(req("/_/admin/settings"));
    const html = await res.text();
    expect(html).toContain('id="language-picker"');
    expect(html).toContain('value="zh"');
    expect(html).toContain("简体中文");
  });
});

describe("Dashboard auto language detection", () => {
  it("tags the dashboard body so the client can auto-detect language on first visit", async () => {
    const res = await SELF.fetch(req("/_/admin/dashboard"));
    const html = await res.text();
    expect(html).toMatch(/<body[^>]*data-page="dashboard"/);
  });
});

describe("Redirects page", () => {
  it("renders rule inputs without a status column", async () => {
    const res = await SELF.fetch(req("/_/admin/redirects"));
    const html = await res.text();
    expect(html).toContain('id="quick-rule-source"');
    expect(html).toContain('id="quick-rule-dest"');
    expect(html).not.toContain("redirects.colStatus");
  });
});
