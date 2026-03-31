// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import { Hono } from "hono";
import type { Env } from "./types";
import { handleRedirect } from "./redirect";
import { getIdentity, unauthorizedResponse } from "./auth";
import type { Identity } from "./auth";
import {
  authenticateApiKey,
  getAllLinks,
  getLinkById,
  getDashboardStats,
  getLinkClickStats,
  getApiKeysByEmail,
  getSetting,
  getUserPreferences,
} from "./db";
import { DEFAULT_SLUG_LENGTH } from "./constants";
import { createTranslateFn, getTranslations } from "./i18n";
import { handleHealth } from "./api/health";
import {
  handleListLinks,
  handleGetLink,
  handleCreateLink,
  handleUpdateLink,
  handleDisableLink,
} from "./api/links";
import { handleAddVanitySlug } from "./api/slugs";
import { handleGetSettings, handleUpdateSettings } from "./api/settings";
import {
  handleGetPreferences,
  handleUpdatePreferences,
} from "./api/preferences";
import { handleListKeys, handleCreateKey, handleDeleteKey } from "./api/keys";
import {
  handleDashboardStats as handleDashboardStatsApi,
  handleLinkAnalytics,
} from "./api/analytics";
import { serveAsset } from "./assets";
import { notFoundResponse } from "./404";
import { handleMcpRequest } from "./mcp/handler";

import { Layout } from "./pages/layout";
import { DashboardPage } from "./pages/dashboard";
import { LinksPage } from "./pages/links";
import { LinkDetailPage } from "./pages/link-detail";
import { KeysPage } from "./pages/keys";
import { SettingsPage } from "./pages/settings";

// ---- Types ----

type AuthContext = {
  identity: string;
  source: "apikey";
  scope: string | null;
};

type HonoEnv = {
  Bindings: Env;
  Variables: {
    identity: Identity;
    auth: AuthContext;
  };
};

const app = new Hono<HonoEnv>();

// ---- Static assets ----

app.get("/favicon.ico", (c) => {
  const asset = serveAsset("/favicon.ico");
  return asset || notFoundResponse();
});

app.get("/apple-touch-icon.png", (c) => {
  const asset = serveAsset("/apple-touch-icon.png");
  return asset || notFoundResponse();
});

// ---- Health check (public) ----

app.get("/_/health", () => handleHealth());

// ---- Admin page helpers ----

async function getPageData(c: { env: Env; var: { identity: Identity } }) {
  const db = c.env.DB;
  const identity = c.var.identity;
  const prefs = await getUserPreferences(db, identity.id);
  const theme = prefs.theme || "oddbit";
  const lang = prefs.language || "en";
  const t = createTranslateFn(lang);
  const translations = getTranslations(lang);
  const slugLengthStr = await getSetting(db, "slug_default_length");
  const slugLength = slugLengthStr ? parseInt(slugLengthStr, 10) : DEFAULT_SLUG_LENGTH;
  return { db, identity, theme, slugLength, lang, t, translations };
}

// ---- Admin identity middleware ----
// Cloudflare Access handles authentication at the edge. This middleware
// extracts the caller's identity from the JWT for user-scoped features
// (preferences, API keys, sidebar display).

app.use("/_/admin/*", async (c, next) => {
  c.set("identity", getIdentity(c.req.raw));
  await next();
});

// ---- Admin pages ----

app.get("/_/admin/dashboard", async (c) => {
  const { db, identity, theme, t, lang, translations } = await getPageData(c);
  const stats = await getDashboardStats(db);
  return c.html(
    <Layout displayName={identity.displayName} active="dashboard" theme={theme} t={t} lang={lang} translations={translations}>
      <DashboardPage stats={stats} t={t} />
    </Layout>,
  );
});

app.get("/_/admin/links", async (c) => {
  const { db, identity, theme, slugLength, t, lang, translations } = await getPageData(c);
  const links = await getAllLinks(db);
  const sort = c.req.query("sort") || "recent";
  const page = parseInt(c.req.query("page") || "1", 10) || 1;
  const perPage = parseInt(c.req.query("per_page") || "25", 10) || 25;
  const showDisabled = c.req.query("show_disabled") === "1";
  return c.html(
    <Layout displayName={identity.displayName} active="links" theme={theme} t={t} lang={lang} translations={translations}>
      <LinksPage
        links={links}
        sort={sort}
        page={page}
        perPage={perPage}
        showDisabled={showDisabled}
        slugLength={slugLength}
        t={t}
        lang={lang}
      />
    </Layout>,
  );
});

app.get("/_/admin/links/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return notFoundResponse();
  const { db, identity, theme, t, lang, translations } = await getPageData(c);
  const link = await getLinkById(db, id);
  if (!link) return notFoundResponse();
  const analytics = await getLinkClickStats(db, id);
  return c.html(
    <Layout displayName={identity.displayName} active="links" theme={theme} t={t} lang={lang} translations={translations}>
      <LinkDetailPage link={link} analytics={analytics} t={t} />
    </Layout>,
  );
});

app.get("/_/admin/keys", async (c) => {
  const { db, identity, theme, t, lang, translations } = await getPageData(c);
  const keys = await getApiKeysByEmail(db, identity.id);
  return c.html(
    <Layout displayName={identity.displayName} active="keys" theme={theme} t={t} lang={lang} translations={translations}>
      <KeysPage keys={keys} t={t} lang={lang} />
    </Layout>,
  );
});

app.get("/_/admin/settings", async (c) => {
  const { identity, theme, slugLength, t, lang, translations } = await getPageData(c);
  return c.html(
    <Layout displayName={identity.displayName} active="settings" theme={theme} t={t} lang={lang} translations={translations}>
      <SettingsPage theme={theme} slugLength={slugLength} lang={lang} t={t} />
    </Layout>,
  );
});

// ---- Legacy redirects ----

app.get("/_/admin", (c) => c.redirect("/_/admin/dashboard", 302));
app.get("/_/admin/", (c) => c.redirect("/_/admin/dashboard", 302));
app.get("/_/admin/link/:slug", (c) => c.redirect("/_/admin/links", 301));
app.get("/_/dashboard", (c) => c.redirect("/_/admin/dashboard", 301));
app.get("/_/links", (c) => c.redirect("/_/admin/links", 301));
app.get("/_/links/:id", (c) => c.redirect(`/_/admin/links/${c.req.param("id")}`, 301));
app.get("/_/keys", (c) => c.redirect("/_/admin/keys", 301));
app.get("/_/settings", (c) => c.redirect("/_/admin/settings", 301));

// ---- MCP endpoint (API key auth) ----

app.all("/_/mcp", async (c) => {
  const auth = await resolveAuth(c.req.raw, c.env);
  if (!auth) return unauthorizedResponse();
  return handleMcpRequest(c.req.raw, c.env, c.executionCtx);
});

// ---- Admin API routes ----
// Cloudflare Access authenticates /_/admin/* at the edge. The identity
// middleware above sets c.var.identity for user-scoped operations.

// Keys
app.get("/_/admin/api/keys", (c) => {
  return handleListKeys(c.env, c.var.identity.id);
});
app.post("/_/admin/api/keys", (c) => {
  return handleCreateKey(c.req.raw, c.env, c.var.identity.id);
});
app.delete("/_/admin/api/keys/:id", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  return handleDeleteKey(c.env, c.var.identity.id, id);
});

// Links (admin path: no scope checks, full access)
app.post("/_/admin/api/links", (c) => handleCreateLink(c.req.raw, c.env));
app.get("/_/admin/api/links", (c) => handleListLinks(c.env));
app.get("/_/admin/api/links/:id", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  return handleGetLink(c.env, id);
});
app.put("/_/admin/api/links/:id", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  return handleUpdateLink(c.req.raw, c.env, id);
});
app.get("/_/admin/api/links/:id/analytics", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  return handleLinkAnalytics(c.env, id);
});
app.post("/_/admin/api/links/:id/disable", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  return handleDisableLink(c.env, id);
});
app.post("/_/admin/api/links/:id/slugs", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  return handleAddVanitySlug(c.req.raw, c.env, id);
});

// Settings
app.get("/_/admin/api/settings", (c) => handleGetSettings(c.env));
app.put("/_/admin/api/settings", (c) => handleUpdateSettings(c.req.raw, c.env));

// Preferences
app.get("/_/admin/api/preferences", (c) => handleGetPreferences(c.env, c.var.identity.id));
app.put("/_/admin/api/preferences", (c) => handleUpdatePreferences(c.req.raw, c.env, c.var.identity.id));

// Dashboard stats
app.get("/_/admin/api/dashboard", (c) => handleDashboardStatsApi(c.env));

// ---- Public API auth middleware ----

app.use("/_/api/*", async (c, next) => {
  const auth = await resolveAuth(c.req.raw, c.env);
  if (!auth) return unauthorizedResponse();
  c.set("auth", auth);
  await next();
});

// ---- Public API routes (link management only) ----

app.post("/_/api/links", (c) => {
  if (!hasScope(c.var.auth, "create")) return forbiddenResponse();
  return handleCreateLink(c.req.raw, c.env);
});
app.get("/_/api/links", (c) => {
  if (!hasScope(c.var.auth, "read")) return forbiddenResponse();
  return handleListLinks(c.env);
});
app.get("/_/api/links/:id", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  if (!hasScope(c.var.auth, "read")) return forbiddenResponse();
  return handleGetLink(c.env, id);
});
app.put("/_/api/links/:id", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  if (!hasScope(c.var.auth, "create")) return forbiddenResponse();
  return handleUpdateLink(c.req.raw, c.env, id);
});
app.get("/_/api/links/:id/analytics", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  if (!hasScope(c.var.auth, "read")) return forbiddenResponse();
  return handleLinkAnalytics(c.env, id);
});
app.post("/_/api/links/:id/disable", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  if (!hasScope(c.var.auth, "create")) return forbiddenResponse();
  return handleDisableLink(c.env, id);
});
app.post("/_/api/links/:id/slugs", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (isNaN(id)) return c.json({ error: "Not Found" }, 404);
  if (!hasScope(c.var.auth, "create")) return forbiddenResponse();
  return handleAddVanitySlug(c.req.raw, c.env, id);
});

// ---- Root redirect ----

app.get("/", (c) => c.redirect("/_/admin/dashboard", 302));

// ---- Slug redirect (catch-all) ----

app.get("/:slug", (c) => {
  const slug = c.req.param("slug");
  if (!slug || slug.startsWith("_")) return notFoundResponse();
  return handleRedirect(slug, c.req.raw, c.env.DB, c.executionCtx);
});

// ---- 404 fallback ----

app.notFound(() => notFoundResponse());

export default app;

// ---- Auth helpers ----

async function resolveAuth(
  request: Request,
  env: Env,
): Promise<AuthContext | null> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const key = await authenticateApiKey(env.DB, token);
    if (key) {
      return { identity: key.email, source: "apikey", scope: key.scope };
    }
  }
  return null;
}

function hasScope(auth: AuthContext, required: string): boolean {
  if (auth.scope === null) return true;
  return auth.scope.split(",").includes(required);
}

function forbiddenResponse(): Response {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
