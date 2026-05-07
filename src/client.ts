// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { Translations } from "./i18n/types";
import { RANDOM_CHARSET } from "./slugs";
import { MIN_SLUG_LENGTH } from "./constants";
import { ACCESS_METHOD_OPTIONS } from "./analytics-fill";

/**
 * Generate the admin client script.
 * 
 * This refactored version uses a proper module pattern with AdminClient namespace
 * instead of relying on fragile global function assignment retry logic.
 * 
 * All functions are methods on window.AdminClient, with backward-compatible
 * global wrappers for inline event handlers like onclick="func()".
 */
export function adminClientScript(version: string, translations: Translations): string {
  const tJson = JSON.stringify(translations);
  const accessMethodOptionsJson = JSON.stringify(ACCESS_METHOD_OPTIONS);
  
  // Extract function bodies from the template below
  // This is injected into the page as an inline script
  return `
'use strict';

(function initAdminClientModule() {
  // ============================================================================
  // MODULE INITIALIZATION AND CONFIGURATION
  // ============================================================================
  
  // Configuration object - set once at module initialization
  var CONFIG = {
    API: '/_/admin/api',
    VERSION: '${version}',
    REPO_URL: 'https://oddb.it/github-shrtnr-app',
    CHARSET_SIZE: ${RANDOM_CHARSET.length},
    MIN_SLUG_LEN: ${MIN_SLUG_LENGTH},
    T: ${tJson},
    ACCESS_METHOD_OPTIONS: ${accessMethodOptionsJson},
  };

  // The main module namespace - all functions are methods on this object
  var AdminClient = {};

  // ============================================================================
  // UTILITY FUNCTIONS (helpers used by other functions)
  // ============================================================================

  AdminClient.fillMissingOptions = function(items, alwaysOn) {
    var seen = {};
    var out = [];
    for (var i = 0; i < items.length; i++) {
      seen[items[i].name] = true;
      out.push(items[i]);
    }
    for (var j = 0; j < alwaysOn.length; j++) {
      if (!seen[alwaysOn[j]]) out.push({ name: alwaysOn[j], count: 0 });
    }
    return out;
  };

  AdminClient.t = function(key, params) {
    var val = CONFIG.T[key] || key;
    if (params) {
      for (var k in params) {
        val = val.replace(new RegExp('\\\\{' + k + '\\\\}', 'g'), String(params[k]));
      }
    }
    return val;
  };

  // ---- Toast ----
  AdminClient.toast = function(msg, type) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast toast-' + (type || 'success');
    el.style.display = 'block';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
  };

  // ---- Modal ----
  AdminClient.closeModal = function() { 
    document.getElementById('modal-overlay').style.display = 'none'; 
  };

  AdminClient.openModal = function(html) {
    document.getElementById('modal').innerHTML = html;
    document.getElementById('modal-overlay').style.display = 'flex';
  };

  // ---- Escape ----
  AdminClient.esc = function(s) { 
    var d = document.createElement('div'); 
    d.textContent = s; 
    return d.innerHTML; 
  };

  // ---- API helper ----
  AdminClient.api = function(path, opts) {
    opts = opts || {};
    if (!opts.headers) opts.headers = {};
    if (opts.body && !opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
    return fetch(CONFIG.API + path, opts).then(function(res) {
      if (res.status === 401) { window.location.reload(); return res; }
      return res;
    });
  };

  // ---- Copy ----
  AdminClient.copyUrl = function(slug) {
    var url = location.origin + '/' + slug;
    navigator.clipboard.writeText(url);
    AdminClient.toast(AdminClient.t('client.copied', {url: url}));
  };

  AdminClient.copyToClipboard = function(slug) {
    AdminClient.copyUrl(slug);
  };

  // ---- Mobile drawer ----
  AdminClient.toggleDrawer = function() {
    var s = document.querySelector('.sidebar');
    var b = document.getElementById('sidebar-backdrop');
    var open = s.classList.toggle('open');
    b.classList.toggle('open', open);
  };

  AdminClient.closeDrawer = function() {
    document.querySelector('.sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').classList.remove('open');
  };

  // Aliases for consistency
  AdminClient.toggleSidebar = function() { AdminClient.toggleDrawer(); };
  AdminClient.closeSidebar = function() { AdminClient.closeDrawer(); };

  // ---- Theme ----
  AdminClient.applyTheme = function(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('#theme-picker .theme-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
  };

  AdminClient.setTheme = function(theme) {
    AdminClient.applyTheme(theme);
    document.cookie = 'theme=' + theme + ';path=/;max-age=31536000;SameSite=Lax';
    AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ theme: theme }) });
    AdminClient.toast(AdminClient.t('client.themeUpdated'));
  };

AdminClient.fillMissingOptions = function (items, alwaysOn) {
  var seen = {};
  var out = [];
  for (var i = 0; i < items.length; i++) { seen[items[i].name] = true; out.push(items[i]); }
  for (var j = 0; j < alwaysOn.length; j++) {
    if (!seen[alwaysOn[j]]) out.push({ name: alwaysOn[j], count: 0 });
  }
  return out;
}

AdminClient.t = function (key, params) {
  var val = CONFIG.T[key] || key;
  if (params) {
    for (var k in params) {
      val = val.replace(new RegExp('\\\\{' + k + '\\\\}', 'g'), String(params[k]));
    }
  }
  return val;
}

// ---- Toast ----
AdminClient.toast = function (msg, type) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast toast-' + (type || 'success');
  el.style.display = 'block';
  setTimeout(function() { el.style.display = 'none'; }, 3000);
}

// ---- Modal ----
AdminClient.closeModal = function () { document.getElementById('modal-overlay').style.display = 'none'; }
AdminClient.openModal = function (html) {
  document.getElementById('modal').innerHTML = html;
  document.getElementById('modal-overlay').style.display = 'flex';
}

// ---- Escape ----
AdminClient.esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ---- CONFIG.API helper ----
AdminClient.api = function (path, opts) {
  opts = opts || {};
  if (!opts.headers) opts.headers = {};
  if (opts.body && !opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';
  return fetch(CONFIG.API + path, opts).then(function(res) {
    if (res.status === 401) { window.location.reload(); return res; }
    return res;
  });
}

// ---- Copy ----
AdminClient.copyUrl = function (slug) {
  var url = location.origin + '/' + slug;
  navigator.clipboard.writeText(url);
  AdminClient.toast(AdminClient.t('client.copied', {url: url}));
}

// ---- Mobile drawer ----
AdminClient.toggleDrawer = function () {
  var s = document.querySelector('.sidebar');
  var b = document.getElementById('sidebar-backdrop');
  var open = s.classList.toggle('open');
  b.classList.toggle('open', open);
}
AdminClient.closeDrawer = function () {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('open');
}

// ---- Theme ----
AdminClient.applyTheme = function (theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('#theme-picker .theme-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
  });
}
AdminClient.setTheme = function (theme) {
  AdminClient.applyTheme(theme);
  document.cookie = 'theme=' + theme + ';path=/;max-age=31536000;SameSite=Lax';
  AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ theme: theme }) });
  AdminClient.toast(AdminClient.t('client.themeUpdated'));
}

// ---- Language ----
AdminClient.setLanguage = function (lang) {
  document.cookie = 'lang=' + lang + ';path=/;max-age=31536000;SameSite=Lax';
  AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ lang: lang }) }).then(function() {
    window.location.reload();
  });
}

// ---- Country names ----
var UI_LANG = CONFIG.T['_lang'] || 'en';
var countryNames = new Intl.DisplayNames([UI_LANG], { type: 'region' });
AdminClient.countryName = function (code) {
  try { return countryNames.of(code) || code; } catch(e) { return code; }
}

// ---- Number formatting ----
var numberFormatter = new Intl.NumberFormat(UI_LANG);
AdminClient.fmtCount = function (n) { return numberFormatter.format(n); }

// ---- Date formatting ----
AdminClient.formatDate = function (ts) {
  var d = new Date(ts * 1000);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---- Quick shorten / search ----
AdminClient.isUrl = function (value) {
  try { var u = new URL(value); return u.protocol === 'http:' || u.protocol === 'https:'; } catch(e) { return false; }
}

AdminClient.quickShorten = function () {
  var value = document.getElementById('quick-url').value.trim();
  var labelEl = document.getElementById('quick-label');
  var label = labelEl ? labelEl.value.trim() : '';
  var slugEl = document.getElementById('quick-slug');
  var customSlug = slugEl ? slugEl.value.trim() : '';
  if (!value) { AdminClient.toast(AdminClient.t('client.pasteUrl'), 'error'); return; }
  if (!AdminClient.isUrl(value)) {
    window.location.href = '/_/admin/links?search=' + encodeURIComponent(value);
    return;
  }
  // Only support dynamic rules and custom slug/label if the elements exist (links page)
  if (customSlug && customSlug.startsWith('/') && slugEl) {
    return AdminClient.upsertDynamicRedirectRule(customSlug, value);
  }
  var body = { url: value };
  if (label && labelEl) body.label = label;
  if (customSlug && slugEl) body.custom_slug = customSlug;
  AdminClient.api('/links', { method: 'POST', body: JSON.stringify(body) }).then(function(res) {
    if (res.ok) {
      var isDuplicate = res.status === 200;
      return res.json().then(function(link) {
        if (isDuplicate) {
          if (link.duplicate_count > 1) {
            window.location.href = '/_/admin/links?search=' + encodeURIComponent(value);
          } else {
            window.location.href = '/_/admin/links/' + link.id;
          }
        } else {
          var primary = link.slugs.find(function(s) { return s.is_primary; })
            || link.slugs.find(function(s) { return s.is_custom; })
            || link.slugs[0];
          if (primary) AdminClient.copyUrl(primary.slug);
          AdminClient.toast(AdminClient.t('client.linkCreatedCopied'));
          window.location.href = '/_/admin/links/' + link.id;
        }
      });
    } else {
      return res.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.createLinkError'), 'error');
      });
    }
  });
}

AdminClient.upsertDynamicRedirectRule = function (sourcePattern, destinationUrl) {
  AdminClient.api('/_/admin/api/redirects').then(function(getRes) {
    if (!getRes.ok) throw new Error('Failed to read rules');
    return getRes.json();
  }).then(function(data) {
    var currentRules = (data.rules || '').trim();
    var nextLine = sourcePattern.trim() + ' ' + destinationUrl.trim();
    var nextRules = currentRules ? (currentRules + '\\n' + nextLine) : nextLine;
    return AdminClient.api('/_/admin/api/redirects', { method: 'PUT', body: JSON.stringify({ rules: nextRules }) });
  }).then(function(putRes) {
    if (!putRes.ok) {
      return putRes.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.createLinkError'), 'error');
      });
    }
    AdminClient.toast(AdminClient.t('client.settingsSaved'));
    window.location.href = '/_/admin/redirects';
  }).catch(function() {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.updateQuickActionButton = function () {
  var el = document.getElementById('quick-url');
  var iconEl = document.getElementById('quick-action-icon');
  var labelEl = document.getElementById('quick-action-label');
  if (!el || !iconEl || !labelEl) return;
  var value = el.value.trim();
  if (value && !AdminClient.isUrl(value)) {
    iconEl.textContent = 'search';
    labelEl.textContent = AdminClient.t('links.search');
  } else {
    iconEl.textContent = 'bolt';
    labelEl.textContent = AdminClient.t('dashboard.shorten');
  }
}

// ---- Create link (modal) ----
AdminClient.showCreateModal = function () {
  var len = (document.getElementById('slug-length-default') || {}).value || '3';
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('client.modalNewLink')) + '</div>' +
    '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('client.destinationUrl')) + '</label><input class="form-input" id="m-url" placeholder="https://example.com/long/path"></div>' +
    '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('client.labelOptional')) + '</label><input class="form-input" id="m-label" placeholder="My Blog Post"></div>' +
    '<div class="form-row"><div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('client.slugLength')) + '</label><input class="form-input" id="m-len" type="number" min="3" value="' + AdminClient.esc(len) + '"></div>' +
    '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('client.customOptional')) + '</label><input class="form-input" id="m-custom" placeholder="my-post"></div></div>' +
    '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('client.expiresOptional')) + '</label><input class="form-input" id="m-expires" type="datetime-local"></div>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-primary" onclick="AdminClient.createLink()">' + AdminClient.esc(AdminClient.t('client.create')) + '</button></div>'
  );
}

AdminClient.createLink = function () {
  var url = document.getElementById('m-url').value.trim();
  if (!url) { AdminClient.toast(AdminClient.t('client.urlRequired'), 'error'); return; }
  var body = { url: url };
  var label = document.getElementById('m-label').value.trim();
  if (label) body.label = label;
  var len = parseInt(document.getElementById('m-len').value);
  if (len >= 3) body.slug_length = len;
  var custom = document.getElementById('m-custom').value.trim();
  var exp = document.getElementById('m-expires').value;
  if (exp) body.expires_at = Math.floor(new Date(exp).getTime() / 1000);

  AdminClient.api('/links', { method: 'POST', body: JSON.stringify(body) }).then(function(res) {
    if (res.ok) {
      var isDuplicate = res.status === 200;
      return res.json().then(function(link) {
        if (isDuplicate) {
          AdminClient.closeModal();
          if (link.duplicate_count > 1) {
            window.location.href = '/_/admin/links?search=' + encodeURIComponent(body.url);
          } else {
            window.location.href = '/_/admin/links/' + link.id;
          }
          return;
        }
        if (!custom) {
          AdminClient.closeModal();
          AdminClient.toast(AdminClient.t('client.linkCreated'));
          window.location.href = '/_/admin/links/' + link.id;
          return;
        }
        AdminClient.api('/links/' + link.id + '/slugs', { method: 'POST', body: JSON.stringify({ slug: custom }) }).then(function(slugRes) {
          AdminClient.closeModal();
          if (!slugRes.ok) {
            AdminClient.toast(AdminClient.t('client.linkCreated'));
          } else {
            AdminClient.toast(AdminClient.t('client.linkCreated'));
          }
          window.location.href = '/_/admin/links/' + link.id;
        });
      });
    } else {
      return res.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.createLinkError'), 'error');
      });
    }
  });
}

// ---- Duplicate link ----
AdminClient.createDuplicate = function (url) {
  AdminClient.api('/links', { method: 'POST', body: JSON.stringify({ url: url, allow_duplicate: true }) }).then(function(res) {
    if (res.ok) {
      return res.json().then(function(link) {
        var primary = link.slugs.find(function(s) { return !s.is_custom; });
        if (primary) AdminClient.copyUrl(primary.slug);
        AdminClient.toast(AdminClient.t('client.linkCreatedCopied'));
        window.location.href = '/_/admin/links/' + link.id;
      });
    } else {
      return res.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.createLinkError'), 'error');
      });
    }
  });
}

// ---- CONFIG.API Keys ----
AdminClient.showCreateKeyModal = function () {
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('client.createApiKey')) + '</div>' +
    '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('client.keyTitleLabel')) + '</label><input class="form-input" id="m-key-title" placeholder="e.g. CI Pipeline, Mobile App"></div>' +
    '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('client.keyScopeLabel')) + '</label>' +
    '<div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.25rem">' +
    '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.875rem"><input type="radio" name="key-scope" value="create"> <strong>' + AdminClient.esc(AdminClient.t('client.scopeCreate')) + '</strong> <span style="color:var(--color-text-muted)">\\u2014 ' + AdminClient.esc(AdminClient.t('client.scopeCreateDesc')) + '</span></label>' +
    '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.875rem"><input type="radio" name="key-scope" value="read"> <strong>' + AdminClient.esc(AdminClient.t('client.scopeRead')) + '</strong> <span style="color:var(--color-text-muted)">\\u2014 ' + AdminClient.esc(AdminClient.t('client.scopeReadDesc')) + '</span></label>' +
    '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.875rem"><input type="radio" name="key-scope" value="create,read" checked> <strong>' + AdminClient.esc(AdminClient.t('client.scopeCreateRead')) + '</strong> <span style="color:var(--color-text-muted)">\\u2014 ' + AdminClient.esc(AdminClient.t('client.scopeCreateReadDesc')) + '</span></label>' +
    '</div></div>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-primary" onclick="AdminClient.createKey()">' + AdminClient.esc(AdminClient.t('client.createKey')) + '</button></div>'
  );
}

AdminClient.createKey = function () {
  var title = document.getElementById('m-key-title').value.trim();
  if (!title) { AdminClient.toast(AdminClient.t('client.titleRequired'), 'error'); return; }
  var checked = document.querySelector('input[name="key-scope"]:checked');
  var scope = checked ? checked.value : null;
  if (!scope) { AdminClient.toast(AdminClient.t('client.selectScope'), 'error'); return; }

  AdminClient.api('/keys', { method: 'POST', body: JSON.stringify({ title: title, scope: scope }) }).then(function(res) {
    if (!res.ok) {
      return res.json().then(function(data) { AdminClient.toast(data.error || AdminClient.t('client.createKeyError'), 'error'); });
    }
    return res.json().then(function(data) { AdminClient.showKeyRevealModal(data.raw_key); });
  });
}

AdminClient.showKeyRevealModal = function (rawKey) {
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('client.keyCreated')) + '</div>' +
    '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1rem">' + AdminClient.esc(AdminClient.t('client.keyCreatedDesc')) + '</p>' +
    '<div class="key-revealed" id="revealed-key">' + AdminClient.esc(rawKey) + '</div>' +
    '<div class="key-warning"><span class="icon" style="font-size:18px">warning</span> ' + AdminClient.esc(AdminClient.t('client.keyWarning')) + '</div>' +
    '<div class="modal-actions"><button class="btn btn-secondary" onclick="AdminClient.copyRawKey()"><span class="icon">content_copy</span> ' + AdminClient.esc(AdminClient.t('client.copy')) + '</button><button class="btn btn-ghost" onclick="AdminClient.closeKeyRevealModal()">' + AdminClient.esc(AdminClient.t('client.done')) + '</button></div>'
  );
}

AdminClient.copyRawKey = function () {
  var key = document.getElementById('revealed-key').textContent;
  navigator.clipboard.writeText(key);
  AdminClient.toast(AdminClient.t('client.apiKeyCopied'));
}

AdminClient.closeKeyRevealModal = function () {
  AdminClient.closeModal();
  window.location.reload();
}

AdminClient.deleteKey = function (id, title) {
  if (!confirm(AdminClient.t('client.confirmDeleteKey', {title: title}))) return;
  AdminClient.api('/keys/' + id, { method: 'DELETE' }).then(function(res) {
    if (res.ok) { AdminClient.toast(AdminClient.t('client.keyDeleted')); window.location.reload(); }
    else AdminClient.toast(AdminClient.t('client.keyDeleteError'), 'error');
  });
}

// ---- Triple-dot menu ----
AdminClient.toggleDetailMenu = function () {
  var menu = document.getElementById('detail-menu');
  var visible = menu.style.display !== 'none';
  menu.style.display = visible ? 'none' : 'block';
  if (!visible) {
    document.addEventListener('click', closeDetailMenuOnOutside);
  }
}
AdminClient.closeDetailMenuOnOutside = function (e) {
  var menu = document.getElementById('detail-menu');
  if (menu && !menu.parentElement.contains(e.target)) {
    menu.style.display = 'none';
    document.removeEventListener('click', closeDetailMenuOnOutside);
  }
}

// ---- Link actions (detail page) ----
AdminClient.showDisableLinkModal = function (id) {
  document.getElementById('detail-menu').style.display = 'none';
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.disable')) + '</div>' +
    '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1.5rem">' + AdminClient.esc(AdminClient.t('linkDetail.confirmDisable')) + '</p>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-danger" onclick="AdminClient.doDisableLink(' + id + ')">' + AdminClient.esc(AdminClient.t('linkDetail.disable')) + '</button></div>'
  );
}
AdminClient.doDisableLink = function (id) {
  AdminClient.api('/links/' + id + '/disable', { method: 'POST' }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); AdminClient.toast(AdminClient.t('client.linkDisabled')); window.location.reload(); }
    else res.json().then(function(body) { AdminClient.toast(body.error || AdminClient.t('client.disableError'), 'error'); }).catch(function() { AdminClient.toast(AdminClient.t('client.disableError'), 'error'); });
  });
}

AdminClient.showDeleteLinkModal = function (id) {
  document.getElementById('detail-menu').style.display = 'none';
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.delete')) + '</div>' +
    '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1.5rem">' + AdminClient.esc(AdminClient.t('linkDetail.confirmDelete')) + '</p>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-danger" onclick="AdminClient.doDeleteLink(' + id + ')">' + AdminClient.esc(AdminClient.t('linkDetail.delete')) + '</button></div>'
  );
}
AdminClient.doDeleteLink = function (id) {
  AdminClient.api('/links/' + id, { method: 'DELETE' }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); AdminClient.toast(AdminClient.t('client.linkDeleted')); window.location.href = '/_/admin/links'; }
    else res.json().then(function(body) { AdminClient.toast(body.error || AdminClient.t('client.deleteError'), 'error'); }).catch(function() { AdminClient.toast(AdminClient.t('client.deleteError'), 'error'); });
  });
}

AdminClient.showEnableLinkModal = function (id) {
  document.getElementById('detail-menu').style.display = 'none';
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.enable')) + '</div>' +
    '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1.5rem">' + AdminClient.esc(AdminClient.t('linkDetail.confirmEnable')) + '</p>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-primary" onclick="AdminClient.doEnableLink(' + id + ')">' + AdminClient.esc(AdminClient.t('linkDetail.enable')) + '</button></div>'
  );
}
AdminClient.doEnableLink = function (id) {
  AdminClient.api('/links/' + id + '/enable', { method: 'POST' }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); AdminClient.toast(AdminClient.t('client.linkEnabled')); window.location.reload(); }
    else res.json().then(function(body) { AdminClient.toast(body.error || AdminClient.t('client.enableError'), 'error'); }).catch(function() { AdminClient.toast(AdminClient.t('client.enableError'), 'error'); });
  });
}

// ---- Add custom slug modal ----
AdminClient.showAddSlugModal = function (linkId) {
  document.getElementById('detail-menu').style.display = 'none';
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.addCustomSlug')) + '</div>' +
    '<div class="form-group"><label class="form-label">Slug</label><input class="form-input" id="m-new-slug" placeholder="my-custom-slug"></div>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-primary" onclick="AdminClient.doAddSlug(' + linkId + ')">' + AdminClient.esc(AdminClient.t('linkDetail.add')) + '</button></div>'
  );
  setTimeout(function() { document.getElementById('m-new-slug').focus(); }, 100);
}
AdminClient.doAddSlug = function (linkId) {
  var slug = document.getElementById('m-new-slug').value.trim();
  if (!slug) { AdminClient.toast(AdminClient.t('client.urlRequired'), 'error'); return; }
  AdminClient.api('/links/' + linkId + '/slugs', { method: 'POST', body: JSON.stringify({ slug: slug }) }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); AdminClient.toast(AdminClient.t('client.customAdded')); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || AdminClient.t('client.customError'), 'error'); });
  });
}

// ---- Change primary slug modal ----
AdminClient.showChangePrimaryModal = function (linkId) {
  document.getElementById('detail-menu').style.display = 'none';
  // Fetch link data to render slug list
  AdminClient.api('/links/' + linkId).then(function(res) {
    if (!res.ok) { AdminClient.toast(AdminClient.t('client.createLinkError'), 'error'); return; }
    return res.json().then(function(link) {
      var html = '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.selectPrimary')) + '</div>';
      html += '<div style="display:flex;flex-direction:column;gap:0.25rem;margin-bottom:1rem">';
      link.slugs.forEach(function(s) {
        var active = s.is_primary ? ' style="background:var(--color-selection);border-color:var(--color-accent)"' : '';
        html += '<button class="btn btn-ghost" ' + active + ' onclick="AdminClient.doSetPrimary(' + linkId + ',\\'' + s.slug + '\\')" style="justify-content:flex-start;font-family:var(--font-family-mono);font-size:0.875rem">';
        html += '/' + AdminClient.esc(s.slug);
        if (s.is_primary) html += ' <span class="icon" style="font-size:14px;color:var(--color-accent);margin-left:auto">star</span>';
        html += '</button>';
      });
      html += '</div>';
      html += '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button></div>';
      AdminClient.openModal(html);
    });
  });
}
AdminClient.doSetPrimary = function (linkId, slug) {
  AdminClient.api('/links/' + linkId + '/slugs/primary', { method: 'PUT', body: JSON.stringify({ slug: slug }) }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); AdminClient.toast(AdminClient.t('client.labelUpdated')); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || 'Error', 'error'); });
  });
}

// ---- Duplicate link modal ----
AdminClient.showDuplicateModal = function (linkId, url) {
  document.getElementById('detail-menu').style.display = 'none';
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.duplicateTitle')) + '</div>' +
    '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:0.75rem">' + AdminClient.esc(AdminClient.t('linkDetail.duplicateBody')) + '</p>' +
    '<p style="font-size:0.8rem;color:var(--color-text-muted);margin-bottom:1.5rem;opacity:0.7">' + AdminClient.esc(AdminClient.t('linkDetail.duplicateHelper')) + '</p>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-primary" onclick="AdminClient.doDuplicate(\\'' + AdminClient.esc(url).replace(/'/g, "\\\\'") + '\\')">' + AdminClient.esc(AdminClient.t('linkDetail.duplicate')) + '</button></div>'
  );
}
AdminClient.doDuplicate = function (url) {
  AdminClient.createDuplicate(url);
  AdminClient.closeModal();
}

// ---- Slug actions (detail page) ----
AdminClient.confirmDeleteSlug = function (linkId, slug) {
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.deleteSlug')) + '</div>' +
    '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1.5rem">' + AdminClient.esc(AdminClient.t('linkDetail.confirmDeleteSlug').replace('{slug}', slug)) + '</p>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-danger" onclick="AdminClient.doDeleteSlug(' + linkId + ',\\'' + slug + '\\')">' + AdminClient.esc(AdminClient.t('linkDetail.deleteSlug')) + '</button></div>'
  );
}
AdminClient.doDeleteSlug = function (linkId, slug) {
  AdminClient.api('/links/' + linkId + '/slugs/' + slug, { method: 'DELETE' }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); AdminClient.toast(AdminClient.t('client.customAdded')); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || 'Error', 'error'); });
  });
}

AdminClient.confirmDisableSlug = function (linkId, slug) {
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.disableSlug')) + '</div>' +
    '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1.5rem">' + AdminClient.esc(AdminClient.t('linkDetail.confirmDisableSlug').replace('{slug}', slug)) + '</p>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-danger" onclick="AdminClient.doDisableSlug(' + linkId + ',\\'' + slug + '\\')">' + AdminClient.esc(AdminClient.t('linkDetail.disableSlug')) + '</button></div>'
  );
}
AdminClient.doDisableSlug = function (linkId, slug) {
  AdminClient.api('/links/' + linkId + '/slugs/' + slug + '/disable', { method: 'POST' }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || 'Error', 'error'); });
  });
}

AdminClient.confirmEnableSlug = function (linkId, slug) {
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.enableSlug')) + '</div>' +
    '<p style="font-size:0.875rem;color:var(--color-text-muted);margin-bottom:1.5rem">' + AdminClient.esc(AdminClient.t('linkDetail.confirmEnableSlug').replace('{slug}', slug)) + '</p>' +
    '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.cancel')) + '</button><button class="btn btn-primary" onclick="AdminClient.doEnableSlug(' + linkId + ',\\'' + slug + '\\')">' + AdminClient.esc(AdminClient.t('linkDetail.enableSlug')) + '</button></div>'
  );
}
AdminClient.doEnableSlug = function (linkId, slug) {
  AdminClient.api('/links/' + linkId + '/slugs/' + slug + '/enable', { method: 'POST' }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || 'Error', 'error'); });
  });
}

// ---- Inline edit: Label ----
AdminClient.beginEditLabel = function () {
  document.getElementById('label-display').style.display = 'none';
  document.getElementById('label-form').style.display = 'flex';
  var inp = document.getElementById('detail-label');
  inp.focus();
  inp.select();
}

AdminClient.cancelEditLabel = function () {
  document.getElementById('label-form').style.display = 'none';
  document.getElementById('label-display').style.display = 'flex';
}

AdminClient.saveDetailLabel = function (linkId) {
  var val = document.getElementById('detail-label').value.trim();
  var body = { label: val || null };
  AdminClient.api('/links/' + linkId, { method: 'PUT', body: JSON.stringify(body) }).then(function(res) {
    if (res.ok) { AdminClient.toast(AdminClient.t('client.labelUpdated')); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || AdminClient.t('client.labelError'), 'error'); });
  });
}

// ---- Inline edit: Expiry ----
AdminClient.beginEditExpiry = function () {
  document.getElementById('expiry-display').style.display = 'none';
  document.getElementById('expiry-form').style.display = 'flex';
  document.getElementById('detail-expires').focus();
}

AdminClient.cancelEditExpiry = function () {
  document.getElementById('expiry-form').style.display = 'none';
  document.getElementById('expiry-display').style.display = 'flex';
}

AdminClient.saveDetailExpiry = function (linkId) {
  var exp = document.getElementById('detail-expires').value;
  var body = { expires_at: exp ? Math.floor(new Date(exp).getTime() / 1000) : null };
  AdminClient.api('/links/' + linkId, { method: 'PUT', body: JSON.stringify(body) }).then(function(res) {
    if (res.ok) { AdminClient.toast(AdminClient.t('client.expiryUpdated')); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || AdminClient.t('client.expiryError'), 'error'); });
  });
}

AdminClient.clearDetailExpiry = function (linkId) {
  AdminClient.api('/links/' + linkId, { method: 'PUT', body: JSON.stringify({ expires_at: null }) }).then(function(res) {
    if (res.ok) { AdminClient.toast(AdminClient.t('client.expiryCleared')); window.location.reload(); }
    else AdminClient.toast(AdminClient.t('client.expiryClearError'), 'error');
  });
}

// ---- QR Code modal ----
var _qrSlug = '';
var _qrSrc = '';

AdminClient.showQRModal = function (linkId, slug) {
  _qrSlug = slug;
  _qrSrc = CONFIG.API + '/links/' + linkId + '/qr?slug=' + encodeURIComponent(slug);
  var shortUrl = location.origin + '/' + slug;
  AdminClient.openModal(
    '<div class="modal-title">' + AdminClient.esc(AdminClient.t('client.qrCode')) + '</div>' +
    '<p style="text-align:center;font-size:0.85rem;color:var(--color-text-muted);margin:0 0 1.25rem">' + AdminClient.esc(shortUrl) + '</p>' +
    '<div style="display:flex;justify-content:center;margin-bottom:1.25rem">' +
      '<img id="qr-img" src="' + _qrSrc + '" style="width:280px;height:280px;border-radius:var(--radius-md);background:#fff;padding:12px;box-sizing:border-box">' +
    '</div>' +
    '<div class="modal-actions">' +
      '<button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('client.close')) + '</button>' +
      '<button class="btn btn-ghost btn-sm" onclick="AdminClient.downloadQrSvg()">' +
        '<span class="icon">download</span> ' + AdminClient.esc(AdminClient.t('client.downloadSvg')) +
      '</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="AdminClient.downloadQrPng()">' +
        '<span class="icon">download</span> ' + AdminClient.esc(AdminClient.t('client.downloadPng')) +
      '</button>' +
    '</div>'
  );
}

AdminClient.downloadQrSvg = function () {
  fetch(_qrSrc).then(function(r) { return r.blob(); }).then(function(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.download = _qrSlug + '-qr.svg';
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  });
}

AdminClient.downloadQrPng = function () {
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 400;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 400, 400);
    ctx.drawImage(img, 0, 0, 400, 400);
    canvas.toBlob(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.download = _qrSlug + '-qr.png';
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };
  img.src = _qrSrc;
}

// ---- Settings ----
AdminClient.setDefaultRange = function (range) {
  AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ default_range: range }) }).then(function(res) {
    if (res.ok) AdminClient.toast(AdminClient.t('client.settingsSaved'));
    else AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.saveSettings = function () {
  var val = parseInt(document.getElementById('slug-length-input').value);
  if (val < 3) { AdminClient.toast(AdminClient.t('client.minSlugLength'), 'error'); return; }
  AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ slug_default_length: val }) }).then(function(res) {
    if (res.ok) {
      AdminClient.updateComboHint();
      AdminClient.toast(AdminClient.t('client.settingsSaved'));
    } else {
      AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
    }
  }).catch(function() {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.setFilterBots = function (checked) {
  AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ filter_bots: Boolean(checked) }) }).then(function(res) {
    if (res.ok) {
      AdminClient.toast(AdminClient.t('client.settingsSaved'));
    } else {
      return res.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.settingsError'), 'error');
      }).catch(function() {
        AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
      });
    }
  }).catch(function(err) {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.setFilterSelfReferrers = function (checked) {
  AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ filter_self_referrers: Boolean(checked) }) }).then(function(res) {
    if (res.ok) {
      AdminClient.toast(AdminClient.t('client.settingsSaved'));
    } else {
      return res.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.settingsError'), 'error');
      }).catch(function() {
        AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
      });
    }
  }).catch(function(err) {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.saveAnalyticsFilters = function () {
  var filterBotsEl = document.getElementById('filter-bots-toggle');
  var filterSelfReferrersEl = document.getElementById('filter-self-referrers-toggle');
  if (!filterBotsEl || !filterSelfReferrersEl) return;
  var filterBots = filterBotsEl.checked;
  var filterSelfReferrers = filterSelfReferrersEl.checked;
  AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ filter_bots: filterBots, filter_self_referrers: filterSelfReferrers }) }).then(function(res) {
    if (res.ok) {
      AdminClient.toast(AdminClient.t('client.settingsSaved'));
    } else {
      return res.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.settingsError'), 'error');
      }).catch(function() {
        AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
      });
    }
  }).catch(function(err) {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.saveRootRedirectUrl = function () {
  var input = document.getElementById('root-redirect-url-input');
  if (!input) return;
  var val = input.value.trim();
  AdminClient.api('/settings', { method: 'PUT', body: JSON.stringify({ root_redirect_url: val || null }) }).then(function(res) {
    if (res.ok) {
      return res.json().then(function(body) {
        input.value = body.root_redirect_url || '';
        AdminClient.toast(AdminClient.t('client.settingsSaved'));
      });
    }
    return res.json().then(function(data) {
      AdminClient.toast(data.error || AdminClient.t('client.settingsError'), 'error');
    }).catch(function() {
      AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
    });
  }).catch(function() {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.saveDynamicRedirectRules = function () {
  var input = document.getElementById('dynamic-redirect-rules-input');
  if (!input) return;
  var val = input.value;
  AdminClient.api('/_/admin/api/redirects', { method: 'PUT', body: JSON.stringify({ rules: val || null }) }).then(function(res) {
    if (res.ok) {
      return res.json().then(function(body) {
        input.value = body.rules || '';
        AdminClient.toast(AdminClient.t('client.settingsSaved'));
      });
    }
    return res.json().then(function(data) {
      AdminClient.toast(data.error || AdminClient.t('client.settingsError'), 'error');
    }).catch(function() {
      AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
    });
  }).catch(function() {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.updateComboHint = function () {
  var el = document.getElementById('slug-combo-hint');
  if (!el) return;
  var len = parseInt(document.getElementById('slug-length-input').value) || CONFIG.MIN_SLUG_LEN;
  var combos = Math.pow(CONFIG.CHARSET_SIZE, Math.max(len, CONFIG.MIN_SLUG_LEN));
  el.textContent = len >= CONFIG.MIN_SLUG_LEN
    ? AdminClient.t('client.combos', {count: AdminClient.fmtCount(combos)})
    : AdminClient.t('client.minLength');
}

AdminClient.addRedirectRule = function () {
  var sourceEl = document.getElementById('quick-rule-source');
  var destEl = document.getElementById('quick-rule-dest');
  if (!sourceEl || !destEl) return;
  var source = sourceEl.value.trim();
  var dest = destEl.value.trim();
  if (!source) { AdminClient.toast(AdminClient.t('client.pasteUrl'), 'error'); return; }
  if (!dest) { AdminClient.toast(AdminClient.t('redirects.destinationUrl'), 'error'); return; }
  AdminClient.api('/_/admin/api/redirects').then(function(getRes) {
    if (!getRes.ok) throw new Error('Failed to read rules');
    return getRes.json();
  }).then(function(data) {
    var currentRules = (data.rules || '').trim();
    var nextLine = source + ' ' + dest;
    var nextRules = currentRules ? (currentRules + '\\n' + nextLine) : nextLine;
    return AdminClient.api('/_/admin/api/redirects', { method: 'PUT', body: JSON.stringify({ rules: nextRules }) });
  }).then(function(putRes) {
    if (!putRes.ok) {
      return putRes.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.settingsError'), 'error');
      });
    }
    sourceEl.value = '';
    destEl.value = '';
    AdminClient.toast(AdminClient.t('client.settingsSaved'));
    window.location.reload();
  }).catch(function() {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

AdminClient.deleteRedirectRule = function (idx) {
  if (!confirm(AdminClient.t('redirects.delete'))) return;
  AdminClient.api('/_/admin/api/redirects').then(function(getRes) {
    if (!getRes.ok) throw new Error('Failed to read rules');
    return getRes.json();
  }).then(function(data) {
    var currentRules = (data.rules || '').trim();
    var lines = currentRules ? currentRules.split('\\n').filter(function(l) { return l.trim(); }) : [];
    if (idx < 0 || idx >= lines.length) return;
    lines.splice(idx, 1);
    var nextRules = lines.join('\\n');
    return AdminClient.api('/_/admin/api/redirects', { method: 'PUT', body: JSON.stringify({ rules: nextRules || null }) });
  }).then(function(putRes) {
    if (!putRes.ok) {
      return putRes.json().then(function(data) {
        AdminClient.toast(data.error || AdminClient.t('client.settingsError'), 'error');
      });
    }
    AdminClient.toast(AdminClient.t('client.settingsSaved'));
    window.location.reload();
  }).catch(function() {
    AdminClient.toast(AdminClient.t('client.settingsError'), 'error');
  });
}

// ---- PWA install ----
var _installPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _installPrompt = e;
  var btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'inline-flex';
});
window.addEventListener('appinstalled', function() {
  var btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'none';
  _installPrompt = null;
});
AdminClient.installApp = function () {
  if (!_installPrompt) return;
  _installPrompt.prompt();
  _installPrompt.userChoice.then(function() { _installPrompt = null; });
}

// ---- Init ----
var quickUrlEl = document.getElementById('quick-url');
if (quickUrlEl) {
  quickUrlEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') AdminClient.quickShorten(); });
  quickUrlEl.addEventListener('input', updateQuickActionButton);
  AdminClient.updateQuickActionButton();
}
var quickSlugEl = document.getElementById('quick-slug');
if (quickSlugEl) {
  quickSlugEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') AdminClient.quickShorten(); });
}

var slugLengthEl = document.getElementById('slug-length-input');
if (slugLengthEl) slugLengthEl.addEventListener('input', function() { AdminClient.updateComboHint(); });

// ---- Analytics + Timeline ----
var _tlData = null;

AdminClient.deviceIcon = function (name) {
  if (name === 'mobile') return 'phone_android';
  if (name === 'tablet') return 'tablet';
  return 'computer';
}
AdminClient.linkModeIcon = function (name) {
  if (name === 'qr') return 'qr_code_2';
  return 'link';
}
AdminClient.osIcon = function (name) {
  if (name === 'ios') return 'phone_iphone';
  if (name === 'macos') return 'laptop_mac';
  if (name === 'android') return 'android';
  if (name === 'windows') return 'desktop_windows';
  if (name === 'linux' || name === 'chromeos') return 'computer';
  return 'devices';
}

AdminClient.renderStatCard = function (containerId, items, color, opts) {
  opts = opts || {};
  var el = document.getElementById(containerId);
  if (!el) return;
  var body = el.querySelector('.stat-card-body');
  if (!body) return;
  if (!items || items.length === 0) {
    body.innerHTML = '<div style="color:var(--color-text-muted);font-size:0.875rem">' + AdminClient.esc(AdminClient.t('linkDetail.noData')) + '</div>';
    return;
  }
  var maxVal = 0;
  for (var mi = 0; mi < items.length; mi++) maxVal += items[mi].count;
  if (maxVal === 0) maxVal = 1;
  var html = '';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var pct = maxVal > 0 ? Math.round((item.count / maxVal) * 100) : 0;
    var name = opts.mapName ? opts.mapName(item.name) : item.name;
    var flagStr = opts.flagFromName ? '<span class="flag">' + AdminClient.esc(item.name) + '</span>' : '';
    var iconStr = opts.iconFn ? '<span class="icon">' + opts.iconFn(item.name) + '</span>' : '';
    html += '<div class="stat-row">';
    html += '<div class="name' + (opts.mono ? ' mono' : '') + '">' + flagStr + iconStr + '<span class="label">' + AdminClient.esc(name) + '</span></div>';
    html += '<div class="right"><span class="count">' + AdminClient.fmtCount(item.count) + '</span><span class="pct">' + pct + '%</span></div>';
    html += '<div class="bar"><div class="fill ' + color + '" style="width:' + pct + '%"></div></div>';
    html += '</div>';
  }
  body.innerHTML = html;
}

AdminClient.loadAnalytics = function (linkId, range) {
  // Update active button
  var btns = document.querySelectorAll('.timeline-range-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].className = 'timeline-range-btn' + (btns[i].getAttribute('data-range') === range ? ' active' : '');
  }

  // Fetch both timeline and analytics in parallel
  var timelineReq = AdminClient.api('/links/' + linkId + '/timeline?range=' + range).then(function(r) { return r.json(); });
  var analyticsReq = AdminClient.api('/links/' + linkId + '/analytics?range=' + range).then(function(r) { return r.json(); });

  Promise.all([timelineReq, analyticsReq]).then(function(results) {
    var tlData = results[0];
    var stats = results[1];
    _tlData = tlData;

    // Update hero total clicks
    var heroTotal = document.getElementById('hero-total-clicks');
    if (heroTotal) heroTotal.textContent = fmtNum(stats.total_clicks);
    var timelineTotal = document.getElementById('timeline-total');
    if (timelineTotal) timelineTotal.textContent = fmtNum(stats.total_clicks);
    var heroAvg = document.getElementById('hero-avg-per-day');
    if (heroAvg) {
      var createdAt = parseInt(heroAvg.getAttribute('data-created-at'), 10);
      heroAvg.textContent = fmtAvgPerDay(stats.total_clicks, range, createdAt);
    }

    // Update per-slug click counts and bars
    var slugCounts = {};
    var slugMax = 0;
    var sc = stats.slug_clicks || [];
    for (var si = 0; si < sc.length; si++) {
      slugCounts[sc[si].slug] = sc[si].count;
      slugMax += sc[si].count;
    }
    if (slugMax === 0) slugMax = 1;
    var rows = document.querySelectorAll('.slugs-row[data-slug-id]');
    for (var ri = 0; ri < rows.length; ri++) {
      var sid = rows[ri].getAttribute('data-slug-id');
      var cnt = slugCounts[sid] || 0;
      var countEl = rows[ri].querySelector('[data-slug-count]');
      if (countEl) countEl.textContent = String(cnt);
      var fillEl = rows[ri].querySelector('[data-slug-fill]');
      if (fillEl) fillEl.style.width = ((cnt / slugMax) * 100).toFixed(0) + '%';
    }

    // Update timeline chart
    renderTimeline(tlData);

    // Update all stat cards
    renderStatCard('card-countries', stats.countries, 'orange', { mapName: countryName, flagFromName: true });
    renderStatCard('card-domains', stats.referrer_hosts, 'mint', { mono: true });
    renderStatCard('card-sources', stats.referrers, 'mint', { mono: true });
    renderStatCard('card-link-modes', AdminClient.fillMissingOptions(stats.link_modes, CONFIG.ACCESS_METHOD_OPTIONS), 'orange', { iconFn: linkModeIcon });
    renderStatCard('card-devices', stats.devices, 'orange', { iconFn: deviceIcon });
    renderStatCard('card-os', stats.os, 'mint', { iconFn: osIcon });
    renderStatCard('card-browsers', stats.browsers, 'mint');

    // Update count pills and hero metrics
    updateCount('count-countries', stats.num_countries);
    updateCount('count-domains', stats.num_referrer_hosts);
    updateCount('count-sources', stats.num_referrers);
    updateCount('count-os', stats.num_os);
    updateCount('count-browsers', stats.num_browsers);
    updateCount('hero-num-countries', stats.num_countries);
    updateCount('hero-num-domains', stats.num_referrer_hosts);
  });
}

AdminClient.updateCount = function (id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = fmtNum(value);
}

AdminClient.fmtNum = function (n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

var RANGE_SECONDS = { '24h': 86400, '7d': 7*86400, '30d': 30*86400, '90d': 90*86400, '1y': 365*86400 };
AdminClient.fmtAvgPerDay = function (totalClicks, range, createdAt) {
  var days;
  if (range !== 'all') {
    days = RANGE_SECONDS[range] / 86400;
  } else {
    var nowSec = Math.floor(Date.now() / 1000);
    var seconds = Math.max(1, nowSec - createdAt);
    days = Math.max(1, seconds / 86400);
  }
  var avg = totalClicks / days;
  if (avg === 0) return '0';
  if (avg < 1) return avg.toFixed(2);
  if (avg < 10) return avg.toFixed(1);
  return String(Math.round(avg));
}

var MONTH_KEYS = ['month.jan','month.feb','month.mar','month.apr','month.may','month.jun','month.jul','month.aug','month.sep','month.oct','month.nov','month.dec'];
AdminClient.monthName = function (m) { return AdminClient.t(MONTH_KEYS[m - 1]); }

AdminClient.fmtLabel = function (label, range) {
  if (range === '24h') {
    // "YYYY-MM-DD HH" → "HH:00"
    return label.slice(11) + ':00';
  }
  if (range === '7d' || range === '30d' || range === '90d' || range === '1y') {
    var parts = label.split('-');
    return monthName(parseInt(parts[1], 10)) + ' ' + parseInt(parts[2], 10);
  }
  // "all": label can be YYYY-MM-DD (daily/weekly) or YYYY-MM (monthly)
  var parts = label.split('-');
  if (parts.length === 3) {
    return monthName(parseInt(parts[1], 10)) + ' ' + parseInt(parts[2], 10);
  }
  return monthName(parseInt(parts[1], 10)) + ' ' + parts[0].slice(2);
}

AdminClient.renderTimeline = function (data) {
  var container = document.getElementById('timeline-chart');
  if (!data.buckets || data.buckets.length === 0) {
    container.innerHTML = '<div class="empty-card-hint">' + AdminClient.esc(AdminClient.t('linkDetail.noClickData')) + '</div>';
    return;
  }

  var buckets = data.buckets;
  var n = buckets.length;
  var maxVal = 0;
  for (var i = 0; i < n; i++) {
    if (buckets[i].count > maxVal) maxVal = buckets[i].count;
  }
  if (maxVal === 0) maxVal = 1;

  var step = niceStep(maxVal);
  var gridMax = Math.ceil(maxVal / step) * step;
  if (gridMax === 0) gridMax = step;

  var w = 800, h = 220;
  var pad = { l: 36, r: 8, t: 10, b: 24 };
  var innerW = w - pad.l - pad.r;
  var innerH = h - pad.t - pad.b;
  var stepX = n > 1 ? innerW / (n - 1) : 0;

  var pts = new Array(n);
  for (var i = 0; i < n; i++) {
    var x = n > 1 ? pad.l + i * stepX : pad.l + innerW / 2;
    var y = pad.t + innerH - (buckets[i].count / gridMax) * innerH;
    pts[i] = [x, y];
  }

  var line = '';
  for (var i = 0; i < n; i++) {
    line += (i === 0 ? 'M' : 'L') + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1) + ' ';
  }
  var lastX = n > 1 ? pad.l + innerW : pts[0][0];
  var baseY = pad.t + innerH;
  var area = line + 'L' + lastX.toFixed(1) + ',' + baseY + ' L' + pad.l + ',' + baseY + ' Z';

  var grid = [0, 0.25, 0.5, 0.75, 1];
  var parts = [];
  parts.push('<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">');
  parts.push('<defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">');
  parts.push('<stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.45"/>');
  parts.push('<stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0"/>');
  parts.push('</linearGradient></defs>');

  for (var gi = 0; gi < grid.length; gi++) {
    var gy = pad.t + innerH * grid[gi];
    var val = Math.round(gridMax * (1 - grid[gi]));
    parts.push('<line x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--color-border)" stroke-opacity="0.35" stroke-width="1" vector-effect="non-scaling-stroke"/>');
    parts.push('<text x="' + (pad.l - 6) + '" y="' + (gy + 3) + '" font-size="9" fill="var(--color-text-subtle)" text-anchor="end" font-family="var(--font-family-mono)">' + fmtNum(val) + '</text>');
  }

  parts.push('<path d="' + area + '" fill="url(#chartGrad)"/>');
  parts.push('<path d="' + line + '" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>');

  var dotInterval = n > 60 ? Math.ceil(n / 10) : (n > 30 ? 5 : (n > 14 ? 3 : 1));
  for (var i = 0; i < n; i++) {
    if (i % dotInterval === 0 || i === n - 1) {
      parts.push('<circle cx="' + pts[i][0].toFixed(1) + '" cy="' + pts[i][1].toFixed(1) + '" r="2.5" fill="var(--color-accent)" stroke="var(--color-surface-raised)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>');
    }
  }

  for (var i = 0; i < n; i++) {
    if (i % dotInterval === 0 || i === n - 1) {
      var label = i === n - 1 ? AdminClient.t('linkDetail.today') : fmtLabel(buckets[i].label, data.range);
      parts.push('<text x="' + pts[i][0].toFixed(1) + '" y="' + (h - 6) + '" font-size="9" fill="var(--color-text-subtle)" text-anchor="middle" font-family="var(--font-family-mono)">' + AdminClient.esc(label) + '</text>');
    }
  }

  parts.push('</svg>');
  container.innerHTML = parts.join('');
}

AdminClient.niceStep = function (max) {
  if (max <= 4) return 1;
  var rough = max / 4;
  var pow = Math.pow(10, Math.floor(Math.log10(rough)));
  var norm = rough / pow;
  if (norm <= 1) return pow;
  if (norm <= 2) return 2 * pow;
  if (norm <= 5) return 5 * pow;
  return 10 * pow;
}

// Auto-load analytics on link detail page
var analyticsRangeBar = document.getElementById('timeline-range');
if (analyticsRangeBar) {
  var linkId = parseInt(analyticsRangeBar.getAttribute('data-link-id'), 10);
  var initialRange = analyticsRangeBar.getAttribute('data-initial-range') || 'all';
  if (linkId) loadAnalytics(linkId, initialRange);
}

// Poll for auto-label if label is empty (background title fetch may be in flight)
var labelDisplay = document.getElementById('label-display');
if (labelDisplay && !labelDisplay.querySelector('.inline-edit-value')) {
  var labelLinkId = analyticsRangeBar ? parseInt(analyticsRangeBar.getAttribute('data-link-id'), 10) : 0;
  if (labelLinkId) {
    var labelAttempts = 0;
    var labelPoll = setInterval(function() {
      labelAttempts++;
      if (labelAttempts > 5) { clearInterval(labelPoll); return; }
      AdminClient.api('/links/' + labelLinkId).then(function(res) {
        if (!res.ok) return;
        return res.json();
      }).then(function(link) {
        if (!link || !link.label) return;
        clearInterval(labelPoll);
        // Update the display inline without reloading
        var display = document.getElementById('label-display');
        var placeholder = display.querySelector('.inline-edit-placeholder');
        if (placeholder) {
          var span = document.createElement('span');
          span.className = 'inline-edit-value';
          span.textContent = link.label;
          placeholder.replaceWith(span);
        }
        // Update the hidden input too
        var inp = document.getElementById('detail-label');
        if (inp) inp.value = link.label;
      });
    }, 2000);
  }
}

// ---- Live polling (15s) ----
var POLL_INTERVAL = 15000;

AdminClient.getActiveRange = function () {
  var btn = document.querySelector('.timeline-range-btn.active')
    || document.querySelector('.range-picker a.active');
  return btn ? btn.getAttribute('data-range') : 'all';
}

// Dashboard polling
AdminClient.pollDashboard = function () {
  var range = getActiveRange();
  var path = '/dashboard' + (range ? '?range=' + encodeURIComponent(range) : '');
  AdminClient.api(path).then(function(res) {
    if (!res.ok) return;
    return res.json();
  }).then(function(d) {
    if (!d) return;
    var el;

    el = document.getElementById('dash-total-links');
    if (el) el.textContent = AdminClient.fmtCount(d.total_links);

    el = document.getElementById('dash-total-clicks');
    if (el) el.textContent = AdminClient.fmtCount(d.total_clicks);

    // Top countries
    var countriesCard = document.getElementById('dash-top-countries');
    if (countriesCard) {
      var cBody = countriesCard.querySelector('.bento-value');
      var cAfter = '';
      var cMax = 0;
      for (var ci = 0; ci < d.top_countries.length; ci++) cMax += d.top_countries[ci].count;
      if (cMax === 0) cMax = 1;
      if (d.top_countries.length === 0) {
        cAfter = '';
        if (cBody) cBody.innerHTML = '<span style="color:var(--color-text-muted)">' + AdminClient.esc(AdminClient.t('dashboard.noData')) + '</span>';
      } else {
        if (cBody) cBody.innerHTML = '';
      }
      // Remove old stat rows and rebuild
      var oldCRows = countriesCard.querySelectorAll('.stat-row');
      for (var cr = 0; cr < oldCRows.length; cr++) oldCRows[cr].remove();
      for (var ci = 0; ci < d.top_countries.length; ci++) {
        var cc = d.top_countries[ci];
        var cpct = Math.round((cc.count / cMax) * 100);
        var row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = '<div class="name"><span class="flag">' + AdminClient.esc(cc.name) + '</span><span class="label">' + AdminClient.esc(AdminClient.countryName(cc.name)) + '</span></div>' +
          '<div class="right"><span class="count">' + AdminClient.fmtCount(cc.count) + '</span><span class="pct">' + cpct + '%</span></div>' +
          '<div class="bar"><div class="fill orange" style="width:' + cpct + '%"></div></div>';
        countriesCard.appendChild(row);
      }
    }

    // Top domains
    var domainsCard = document.getElementById('dash-top-domains');
    if (domainsCard) {
      var oldSRows = domainsCard.querySelectorAll('.stat-row');
      for (var sr = 0; sr < oldSRows.length; sr++) oldSRows[sr].remove();
      var sNoData = domainsCard.querySelector('.muted-hint');
      var sMax = 0;
      for (var si = 0; si < d.top_referrers.length; si++) sMax += d.top_referrers[si].count;
      if (sMax === 0) sMax = 1;
      if (d.top_referrers.length === 0) {
        if (!sNoData) {
          var nd = document.createElement('div');
          nd.className = 'muted-hint';
          nd.textContent = AdminClient.t('dashboard.noData');
          domainsCard.appendChild(nd);
        }
      } else {
        if (sNoData) sNoData.remove();
        for (var si = 0; si < d.top_referrers.length; si++) {
          var ref = d.top_referrers[si];
          var rpct = Math.round((ref.count / sMax) * 100);
          var row = document.createElement('div');
          row.className = 'stat-row';
          row.innerHTML = '<div class="name"><span class="label">' + AdminClient.esc(ref.name) + '</span></div>' +
            '<div class="right"><span class="count">' + AdminClient.fmtCount(ref.count) + '</span><span class="pct">' + rpct + '%</span></div>' +
            '<div class="bar"><div class="fill mint" style="width:' + rpct + '%"></div></div>';
          domainsCard.appendChild(row);
        }
      }
    }

    // Recent links
    var recentCard = document.getElementById('dash-recent-links');
    if (recentCard) {
      var recentLinks = recentCard.querySelectorAll('a');
      for (var rl = 0; rl < recentLinks.length; rl++) recentLinks[rl].remove();
      var recentNoData = recentCard.querySelector('.muted-hint');
      if (d.recent_links.length === 0) {
        if (!recentNoData) {
          var nd = document.createElement('div');
          nd.className = 'muted-hint';
          nd.textContent = AdminClient.t('dashboard.noLinks');
          recentCard.appendChild(nd);
        }
      } else {
        if (recentNoData) recentNoData.remove();
        for (var ri = 0; ri < d.recent_links.length; ri++) {
          var link = d.recent_links[ri];
          var slug = '';
          for (var si = 0; si < link.slugs.length; si++) {
            if (!link.slugs[si].is_custom) { slug = link.slugs[si].slug; break; }
          }
          if (!slug && link.slugs.length > 0) slug = link.slugs[0].slug;
          var a = document.createElement('a');
          a.href = '/_/admin/links/' + link.id;
          a.style.cssText = 'display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;cursor:pointer;overflow:hidden;min-width:0;text-decoration:none;color:inherit';
          a.innerHTML = '<span class="slug-chip" onclick="event.preventDefault();event.stopPropagation();AdminClient.copyUrl(\\'' + AdminClient.esc(slug) + '\\')" title="' + AdminClient.esc(AdminClient.t('dashboard.clickToCopy')) + '">' + AdminClient.esc(slug) + ' <span class="icon" style="font-size:14px">content_copy</span></span>' +
            '<span style="flex:1;min-width:0;font-size:0.8rem;color:var(--color-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + AdminClient.esc(link.url) + '</span>' +
            '<span style="font-family:var(--font-family-display);font-weight:700;color:var(--color-accent);flex-shrink:0">' + AdminClient.fmtCount(link.total_clicks) + '</span>';
          recentCard.appendChild(a);
        }
      }
    }

    // Top links
    var topLinksCard = document.getElementById('dash-top-links');
    if (topLinksCard) {
      var oldTLinks = topLinksCard.querySelectorAll('a');
      for (var tl = 0; tl < oldTLinks.length; tl++) oldTLinks[tl].remove();
      var tlNoData = topLinksCard.querySelector('.muted-hint');
      var tlMax = 0;
      for (var ti = 0; ti < d.top_links.length; ti++) tlMax += d.top_links[ti].total_clicks;
      if (tlMax === 0) tlMax = 1;
      if (d.top_links.length === 0) {
        if (!tlNoData) {
          var nd = document.createElement('div');
          nd.className = 'muted-hint';
          nd.textContent = AdminClient.t('dashboard.noData');
          topLinksCard.appendChild(nd);
        }
      } else {
        if (tlNoData) tlNoData.remove();
        for (var ti = 0; ti < d.top_links.length; ti++) {
          var tLink = d.top_links[ti];
          var tSlug = '';
          for (var si = 0; si < tLink.slugs.length; si++) {
            if (!tLink.slugs[si].is_custom) { tSlug = tLink.slugs[si].slug; break; }
          }
          if (!tSlug && tLink.slugs.length > 0) tSlug = tLink.slugs[0].slug;
          var tPct = Math.round((tLink.total_clicks / tlMax) * 100);
          var a = document.createElement('a');
          a.href = '/_/admin/links/' + tLink.id;
          a.className = 'top-link-row';
          a.innerHTML = '<div class="stat-row">' +
            '<div class="name mono"><span class="label">' + AdminClient.esc(tSlug) + '</span></div>' +
            '<div class="right"><span class="count">' + AdminClient.fmtCount(tLink.total_clicks) + '</span><span class="pct">' + tPct + '%</span></div>' +
            '<div class="bar"><div class="fill orange" style="width:' + tPct + '%"></div></div>' +
            '</div>' +
            '<div class="top-link-row-url">' + AdminClient.esc(tLink.url) + '</div>';
          topLinksCard.appendChild(a);
        }
      }
    }
  });
}

// Link detail polling
AdminClient.pollLinkDetail = function (linkId) {
  var range = getActiveRange();
  loadAnalytics(linkId, range);
}

// Start polling based on current page
if (document.getElementById('dashboard-bento')) {
  setInterval(pollDashboard, POLL_INTERVAL);
}

if (analyticsRangeBar) {
  var pollLinkId = parseInt(analyticsRangeBar.getAttribute('data-link-id'), 10);
  if (pollLinkId) {
    setInterval(function() { pollLinkDetail(pollLinkId); }, POLL_INTERVAL);
  }
}

// ============================================================
// Bundles
// ============================================================

var BUNDLE_ACCENTS = ['orange','red','green','blue','purple'];

// Curated icon set for bundles. Material Symbol names grouped by semantic
// category so the grid reads top-to-bottom as: containers, campaigns,
// people, tech, creative, analytics, commerce.
var BUNDLE_ICONS = [
  'inventory_2','folder','folder_open','archive','bookmarks','collections_bookmark','category',
  'campaign','flag','rocket_launch','celebration','local_fire_department','bolt','auto_awesome',
  'handshake','groups','business_center','work','corporate_fare','diversity_3','school',
  'code','terminal','data_object','api','integration_instructions','cloud','memory',
  'palette','brush','design_services','photo_camera','movie','mic','edit',
  'analytics','trending_up','insights','bar_chart','dashboard','monitoring','query_stats',
  'shopping_cart','store','sell','paid','savings','redeem','credit_card',
];

AdminClient.renderIconPicker = function (selected) {
  var chosen = selected || 'inventory_2';
  // If the pre-selected icon is not in our curated set (e.g. from an older
  // bundle that had a typed icon), prepend it so it stays selectable.
  var list = BUNDLE_ICONS.slice();
  if (list.indexOf(chosen) === -1) list.unshift(chosen);
  var html = '<div class="bundle-icon-picker" id="bundle-icon-picker">';
  list.forEach(function(name) {
    var cls = 'bundle-icon-option' + (name === chosen ? ' selected' : '');
    html += '<button type="button" class="' + cls + '" data-icon="' + AdminClient.esc(name) + '" onclick="selectBundleIcon(\\'' + name + '\\')" aria-label="' + AdminClient.esc(name) + '"><span class="icon">' + AdminClient.esc(name) + '</span></button>';
  });
  html += '</div>';
  html += '<input type="hidden" id="bundle-icon" value="' + AdminClient.esc(chosen) + '">';
  return html;
}

AdminClient.selectBundleIcon = function (name) {
  var picker = document.getElementById('bundle-icon-picker');
  if (!picker) return;
  var buttons = picker.querySelectorAll('.bundle-icon-option');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.toggle('selected', buttons[i].getAttribute('data-icon') === name);
  }
  var input = document.getElementById('bundle-icon');
  if (input) input.value = name;
}

AdminClient.renderAccentPicker = function (selected, inputId) {
  var html = '<div class="accent-picker" id="accent-picker">';
  BUNDLE_ACCENTS.forEach(function(a) {
    var cls = 'accent-swatch accent-' + a + (a === selected ? ' selected' : '');
    html += '<button type="button" class="' + cls + '" data-accent="' + a + '" onclick="selectAccent(\\'' + a + '\\')" title="' + AdminClient.esc(AdminClient.t('bundles.accent.' + a)) + '"></button>';
  });
  html += '<input type="hidden" id="' + inputId + '" value="' + AdminClient.esc(selected) + '">';
  html += '</div>';
  return html;
}

AdminClient.selectAccent = function (a) {
  var picker = document.getElementById('accent-picker');
  if (!picker) return;
  var swatches = picker.querySelectorAll('.accent-swatch');
  for (var i = 0; i < swatches.length; i++) {
    swatches[i].classList.toggle('selected', swatches[i].getAttribute('data-accent') === a);
  }
  var input = document.getElementById('bundle-accent');
  if (input) input.value = a;
}

AdminClient.showCreateBundleModal = function (onCreated) {
  // Stash the optional callback so doCreateBundle can pick it up without us
  // having to rewrite the button's onclick attribute after render.
  window.__bundleOnCreated = typeof onCreated === 'function' ? onCreated : null;
  var html = '<div class="modal-title">' + AdminClient.esc(AdminClient.t('bundles.newBundle')) + '</div>';
  html += '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('bundles.formName')) + ' *</label>';
  html += '<input class="form-input" id="bundle-name" placeholder="' + AdminClient.esc(AdminClient.t('bundles.formNameHint')) + '"></div>';
  html += '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('bundles.formDescription')) + '</label>';
  html += '<input class="form-input" id="bundle-description" placeholder="' + AdminClient.esc(AdminClient.t('bundles.formDescriptionHint')) + '"></div>';
  html += '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('bundles.formIcon')) + '</label>';
  html += renderIconPicker('inventory_2') + '</div>';
  html += '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('bundles.formAccent')) + '</label>';
  html += renderAccentPicker('orange', 'bundle-accent') + '</div>';
  html += '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('bundles.cancel')) + '</button>';
  html += '<button class="btn btn-primary" onclick="doCreateBundle()">' + AdminClient.esc(AdminClient.t('bundles.create')) + '</button></div>';
  AdminClient.openModal(html);
  setTimeout(function() { var el = document.getElementById('bundle-name'); if (el) el.focus(); }, 100);
}

AdminClient.doCreateBundle = function () {
  var name = document.getElementById('bundle-name').value.trim();
  if (!name) { AdminClient.toast(AdminClient.t('client.urlRequired'), 'error'); return; }
  var body = {
    name: name,
    description: document.getElementById('bundle-description').value.trim() || null,
    icon: document.getElementById('bundle-icon').value.trim() || null,
    accent: document.getElementById('bundle-accent').value || 'orange',
  };
  var onCreated = window.__bundleOnCreated;
  window.__bundleOnCreated = null;
  AdminClient.api('/bundles', { method: 'POST', body: JSON.stringify(body) }).then(function(res) {
    if (res.ok) {
      res.json().then(function(bundle) {
        AdminClient.closeModal();
        AdminClient.toast(AdminClient.t('client.bundles.created'));
        if (typeof onCreated === 'function') {
          onCreated(bundle);
        } else {
          window.location.reload();
        }
      });
    } else {
      res.json().then(function(data) { AdminClient.toast(data.error || AdminClient.t('client.bundles.createError'), 'error'); });
    }
  });
}

AdminClient.showEditBundleModal = function (bundleId) {
  var menu = document.getElementById('detail-menu');
  if (menu) menu.style.display = 'none';
  AdminClient.api('/bundles/' + bundleId).then(function(res) {
    if (!res.ok) { AdminClient.toast(AdminClient.t('client.bundles.saveError'), 'error'); return; }
    res.json().then(function(b) {
      var html = '<div class="modal-title">' + AdminClient.esc(AdminClient.t('bundles.editBundle')) + '</div>';
      html += '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('bundles.formName')) + ' *</label>';
      html += '<input class="form-input" id="bundle-name" value="' + AdminClient.esc(b.name || '') + '"></div>';
      html += '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('bundles.formDescription')) + '</label>';
      html += '<input class="form-input" id="bundle-description" value="' + AdminClient.esc(b.description || '') + '"></div>';
      html += '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('bundles.formIcon')) + '</label>';
      html += renderIconPicker(b.icon || 'inventory_2') + '</div>';
      html += '<div class="form-group"><label class="form-label">' + AdminClient.esc(AdminClient.t('bundles.formAccent')) + '</label>';
      html += renderAccentPicker(b.accent || 'orange', 'bundle-accent') + '</div>';
      html += '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('bundles.cancel')) + '</button>';
      html += '<button class="btn btn-primary" onclick="doUpdateBundle(' + bundleId + ')">' + AdminClient.esc(AdminClient.t('bundles.save')) + '</button></div>';
      AdminClient.openModal(html);
    });
  });
}

AdminClient.doUpdateBundle = function (bundleId) {
  var name = document.getElementById('bundle-name').value.trim();
  if (!name) { AdminClient.toast(AdminClient.t('client.urlRequired'), 'error'); return; }
  var body = {
    name: name,
    description: document.getElementById('bundle-description').value.trim() || null,
    icon: document.getElementById('bundle-icon').value.trim() || null,
    accent: document.getElementById('bundle-accent').value || 'orange',
  };
  AdminClient.api('/bundles/' + bundleId, { method: 'PUT', body: JSON.stringify(body) }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); AdminClient.toast(AdminClient.t('client.bundles.updated')); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || AdminClient.t('client.bundles.saveError'), 'error'); });
  });
}

AdminClient.archiveBundle = function (bundleId, name) {
  var menu = document.getElementById('detail-menu');
  if (menu) menu.style.display = 'none';
  if (!confirm(AdminClient.t('client.bundles.confirmArchive', { name: name }))) return;
  AdminClient.api('/bundles/' + bundleId + '/archive', { method: 'POST' }).then(function(res) {
    if (res.ok) { AdminClient.toast(AdminClient.t('client.bundles.archived')); window.location.href = '/_/admin/bundles'; }
    else AdminClient.toast(AdminClient.t('client.bundles.saveError'), 'error');
  });
}

AdminClient.unarchiveBundle = function (bundleId) {
  var menu = document.getElementById('detail-menu');
  if (menu) menu.style.display = 'none';
  AdminClient.api('/bundles/' + bundleId + '/unarchive', { method: 'POST' }).then(function(res) {
    if (res.ok) { AdminClient.toast(AdminClient.t('client.bundles.unarchived')); window.location.reload(); }
    else AdminClient.toast(AdminClient.t('client.bundles.saveError'), 'error');
  });
}

AdminClient.deleteBundleAction = function (bundleId, name) {
  var menu = document.getElementById('detail-menu');
  if (menu) menu.style.display = 'none';
  if (!confirm(AdminClient.t('client.bundles.confirmDelete', { name: name }))) return;
  AdminClient.api('/bundles/' + bundleId, { method: 'DELETE' }).then(function(res) {
    if (res.ok) { AdminClient.toast(AdminClient.t('client.bundles.deleted')); window.location.href = '/_/admin/bundles'; }
    else AdminClient.toast(AdminClient.t('client.bundles.deleteError'), 'error');
  });
}

AdminClient.removeLinkFromBundle = function (bundleId, linkId) {
  if (!confirm(AdminClient.t('bundles.removeFromBundle') + '?')) return;
  AdminClient.api('/bundles/' + bundleId + '/links/' + linkId, { method: 'DELETE' }).then(function(res) {
    if (res.ok) { AdminClient.toast(AdminClient.t('client.bundles.updated')); window.location.reload(); }
    else AdminClient.toast(AdminClient.t('client.bundles.saveError'), 'error');
  });
}

AdminClient.showAddToBundleModal = function (linkId) {
  var menu = document.getElementById('detail-menu');
  if (menu) menu.style.display = 'none';
  Promise.all([
    AdminClient.api('/bundles?archived=false'),
    AdminClient.api('/links/' + linkId + '/bundles'),
  ]).then(function(responses) {
    return Promise.all(responses.map(function(r) { return r.json(); }));
  }).then(function(data) {
    var allBundles = data[0] || [];
    var memberOf = data[1] || [];
    var memberIds = {};
    memberOf.forEach(function(b) { memberIds[b.id] = true; });

    var html = '<div class="modal-title">' + AdminClient.esc(AdminClient.t('linkDetail.addToBundle')) + '</div>';
    if (allBundles.length === 0) {
      html += '<div class="add-to-bundle-empty">' + AdminClient.esc(AdminClient.t('client.bundles.noBundles')) + '</div>';
    } else {
      html += '<div class="add-to-bundle-list">';
      allBundles.forEach(function(b) {
        var selectedCls = memberIds[b.id] ? ' selected' : '';
        html += '<button type="button" class="add-to-bundle-row accent-' + AdminClient.esc(b.accent || 'orange') + selectedCls + '" data-bundle-id="' + b.id + '" onclick="AdminClient.toggleAddToBundleRow(this)">';
        html += '<span class="icon">' + AdminClient.esc(b.icon || 'inventory_2') + '</span>';
        html += '<div><div class="add-to-bundle-row-name">' + AdminClient.esc(b.name) + '</div>';
        if (b.description) html += '<div class="add-to-bundle-row-desc">' + AdminClient.esc(b.description) + '</div>';
        html += '</div></button>';
      });
      html += '</div>';
    }
    html += '<div class="add-to-bundle-create"><button type="button" class="btn btn-ghost" onclick="AdminClient.showCreateBundleForLink(' + linkId + ')">+ ' + AdminClient.esc(AdminClient.t('client.bundles.createNew')) + '</button></div>';
    html += '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('bundles.cancel')) + '</button>';
    html += '<button class="btn btn-primary" onclick="AdminClient.saveAddToBundle(' + linkId + ')">' + AdminClient.esc(AdminClient.t('bundles.save')) + '</button></div>';
    AdminClient.openModal(html);

    // Stash the original memberships so save can compute the diff.
    window.__bundleOriginalMembership = memberIds;
  });
}

AdminClient.showCreateBundleForLink = function (linkId) {
  // On create, attach the link to the new bundle. The callback is threaded
  // through the modal rather than spliced into the primary button's onclick
  // attribute, so renames to the modal markup do not silently break this.
  showCreateBundleModal(function(bundle) {
    AdminClient.api('/bundles/' + bundle.id + '/links', {
      method: 'POST',
      body: JSON.stringify({ link_id: linkId }),
    }).then(function(res) {
      if (res.ok) {
        AdminClient.toast(AdminClient.t('client.bundles.updated'));
        window.location.reload();
      } else {
        AdminClient.toast(AdminClient.t('client.bundles.saveError'), 'error');
      }
    });
  });
}

AdminClient.toggleAddToBundleRow = function (el) {
  el.classList.toggle('selected');
}

AdminClient.saveAddToBundle = function (linkId) {
  var original = window.__bundleOriginalMembership || {};
  var rows = document.querySelectorAll('.add-to-bundle-list .add-to-bundle-row');
  var desired = {};
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].classList.contains('selected')) desired[rows[i].getAttribute('data-bundle-id')] = true;
  }
  var toAdd = [];
  var toRemove = [];
  for (var id in desired) if (!original[id]) toAdd.push(id);
  for (var id2 in original) if (!desired[id2]) toRemove.push(id2);

  var ops = [];
  toAdd.forEach(function(bid) {
    ops.push(AdminClient.api('/bundles/' + bid + '/links', {
      method: 'POST',
      body: JSON.stringify({ link_id: linkId }),
    }));
  });
  toRemove.forEach(function(bid) {
    ops.push(AdminClient.api('/bundles/' + bid + '/links/' + linkId, { method: 'DELETE' }));
  });

  Promise.all(ops).then(function(results) {
    var failed = results.some(function(r) { return !r.ok; });
    if (failed) {
      AdminClient.toast(AdminClient.t('client.bundles.saveError'), 'error');
    } else {
      AdminClient.closeModal();
      AdminClient.toast(AdminClient.t('client.bundles.updated'));
      window.location.reload();
    }
  });
}

AdminClient.showAddLinkToBundlePicker = function (bundleId, excludeIds) {
  var exclude = {};
  if (excludeIds && excludeIds.length) {
    for (var i = 0; i < excludeIds.length; i++) exclude[excludeIds[i]] = true;
  }
  AdminClient.api('/links').then(function(res) {
    if (!res.ok) { AdminClient.toast(AdminClient.t('client.createLinkError'), 'error'); return; }
    res.json().then(function(links) {
      var available = links.filter(function(link) { return !exclude[link.id]; });
      var html = '<div class="modal-title">' + AdminClient.esc(AdminClient.t('bundles.addLinkToBundle')) + '</div>';
      html += '<div class="form-group"><input class="form-input" id="bundle-link-search" placeholder="' + AdminClient.esc(AdminClient.t('links.search')) + '" oninput="AdminClient.filterBundleLinkPicker()"></div>';
      html += '<div class="add-to-bundle-list" id="bundle-link-picker-list">';
      if (available.length === 0) {
        html += '<div class="muted-hint">' + AdminClient.esc(AdminClient.t('bundles.allLinksAdded')) + '</div>';
      } else {
        available.forEach(function(link) {
          var slug = '';
          if (link.slugs && link.slugs.length > 0) {
            var primary = link.slugs.find(function(s) { return s.is_primary; }) || link.slugs[0];
            slug = primary.slug;
          }
          var label = link.label || link.url;
          html += '<div class="add-to-bundle-row" data-search="' + AdminClient.esc((link.label || '') + ' ' + link.url + ' ' + slug).toLowerCase() + '" onclick="AdminClient.doAddLinkToBundle(' + bundleId + ',' + link.id + ')">';
          html += '<span class="slug-chip">' + AdminClient.esc(slug) + '</span>';
          html += '<div><div class="add-to-bundle-row-name">' + AdminClient.esc(label) + '</div>';
          html += '<div class="add-to-bundle-row-desc">' + AdminClient.esc(link.url) + '</div></div>';
          html += '</div>';
        });
      }
      html += '</div>';
      html += '<div class="modal-actions"><button class="btn btn-ghost" onclick="AdminClient.closeModal()">' + AdminClient.esc(AdminClient.t('bundles.cancel')) + '</button></div>';
      AdminClient.openModal(html);
    });
  });
}

AdminClient.filterBundleLinkPicker = function () {
  var q = (document.getElementById('bundle-link-search').value || '').toLowerCase();
  var rows = document.querySelectorAll('#bundle-link-picker-list .add-to-bundle-row');
  for (var i = 0; i < rows.length; i++) {
    var hay = rows[i].getAttribute('data-search') || '';
    rows[i].style.display = hay.indexOf(q) >= 0 ? '' : 'none';
  }
}

AdminClient.doAddLinkToBundle = function (bundleId, linkId) {
  AdminClient.api('/bundles/' + bundleId + '/links', {
    method: 'POST',
    body: JSON.stringify({ link_id: linkId }),
  }).then(function(res) {
    if (res.ok) { AdminClient.closeModal(); AdminClient.toast(AdminClient.t('client.bundles.updated')); window.location.reload(); }
    else res.json().then(function(data) { AdminClient.toast(data.error || AdminClient.t('client.bundles.saveError'), 'error'); });
  });
}

// Delegated click handler for bundle-detail menu buttons. Reading bundle id
// and name from data-* attributes avoids interpolating user-controlled text
// into an inline onclick handler.
document.addEventListener('click', function(ev) {
  var btn = ev.target && ev.target.closest ? ev.target.closest('[data-bundle-action]') : null;
  if (!btn) return;
  var action = btn.getAttribute('data-bundle-action');
  var id = parseInt(btn.getAttribute('data-bundle-id'), 10);
  var name = btn.getAttribute('data-bundle-name') || '';
  if (!id) return;
  if (action === 'archive') archiveBundle(id, name);
  else if (action === 'unarchive') unarchiveBundle(id);
  else if (action === 'delete') deleteBundleAction(id, name);
});

  // ============================================================================
  // EXPORT MODULE TO WINDOW
  // ============================================================================

  // Make AdminClient available as a namespace
  window.AdminClient = AdminClient;

  // Create backward-compatible global functions
  // These allow existing onclick="func()" handlers to continue working
  // while delegating to the AdminClient namespace
  window.t = function(key, params) { return AdminClient.t(key, params); };
  window.toast = function(msg, type) { return AdminClient.toast(msg, type); };
  window.closeModal = function() { return AdminClient.closeModal(); };
  window.openModal = function(html) { return AdminClient.openModal(html); };
  window.esc = function(s) { return AdminClient.esc(s); };
  window.api = function(path, opts) { return AdminClient.api(path, opts); };
  window.copyUrl = function(slug) { return AdminClient.copyUrl(slug); };
  window.copyToClipboard = function(slug) { return AdminClient.copyToClipboard(slug); };
  window.toggleDrawer = function() { return AdminClient.toggleDrawer(); };
  window.closeDrawer = function() { return AdminClient.closeDrawer(); };
  window.toggleSidebar = function() { return AdminClient.toggleSidebar(); };
  window.closeSidebar = function() { return AdminClient.closeSidebar(); };
  window.applyTheme = function(theme) { return AdminClient.applyTheme(theme); };
  window.setTheme = function(theme) { return AdminClient.setTheme(theme); };
  window.setLanguage = function(lang) { return AdminClient.setLanguage(lang); };
  window.setFilterBots = function(checked) { return AdminClient.setFilterBots(checked); };
  window.setFilterSelfReferrers = function(checked) { return AdminClient.setFilterSelfReferrers(checked); };
  window.updateComboHint = function() { return AdminClient.updateComboHint(); };
  window.countryName = function(code) { return AdminClient.countryName(code); };
  window.fmtCount = function(n) { return AdminClient.fmtCount(n); };
  window.formatDate = function(ts) { return AdminClient.formatDate(ts); };
  window.isUrl = function(v) { return AdminClient.isUrl(v); };
  window.quickShorten = function() { return AdminClient.quickShorten(); };
  window.upsertDynamicRedirectRule = function(s, d) { return AdminClient.upsertDynamicRedirectRule(s, d); };
  window.updateQuickActionButton = function() { return AdminClient.updateQuickActionButton(); };
  window.showCreateModal = function() { return AdminClient.showCreateModal(); };
  window.createLink = function() { return AdminClient.createLink(); };
  window.createDuplicate = function(url) { return AdminClient.createDuplicate(url); };
  window.showCreateKeyModal = function() { return AdminClient.showCreateKeyModal(); };
  window.createKey = function() { return AdminClient.createKey(); };
  window.showKeyRevealModal = function(key) { return AdminClient.showKeyRevealModal(key); };
  window.copyRawKey = function() { return AdminClient.copyRawKey(); };
  window.closeKeyRevealModal = function() { return AdminClient.closeKeyRevealModal(); };
  window.deleteKey = function(id, title) { return AdminClient.deleteKey(id, title); };
  window.toggleDetailMenu = function() { return AdminClient.toggleDetailMenu(); };
  window.cancelEditLabel = function(linkId, slugId) { return AdminClient.cancelEditLabel(linkId, slugId); };
  window.cancelEditExpiry = function(linkId, slugId) { return AdminClient.cancelEditExpiry(linkId, slugId); };
  window.saveDetailLabel = function(linkId, slugId) { return AdminClient.saveDetailLabel(linkId, slugId); };
  window.saveDetailExpiry = function(linkId, slugId) { return AdminClient.saveDetailExpiry(linkId, slugId); };
  window.showQRModal = function(slug) { return AdminClient.showQRModal(slug); };
  window.saveSettings = function() { return AdminClient.saveSettings(); };
  window.saveAnalyticsFilters = function() { return AdminClient.saveAnalyticsFilters(); };
  window.saveRootRedirectUrl = function() { return AdminClient.saveRootRedirectUrl(); };
  window.setDefaultRange = function(r) { return AdminClient.setDefaultRange(r); };
  window.addRedirectRule = function() { return AdminClient.addRedirectRule(); };
  window.deleteRedirectRule = function(idx) { return AdminClient.deleteRedirectRule(idx); };
  window.doAddSlug = function(id) { return AdminClient.doAddSlug(id); };
  window.doDeleteLink = function(id) { return AdminClient.doDeleteLink(id); };
  window.doDeleteSlug = function(id) { return AdminClient.doDeleteSlug(id); };
  window.doDisableLink = function(id) { return AdminClient.doDisableLink(id); };
  window.doDisableSlug = function(id) { return AdminClient.doDisableSlug(id); };
  window.doDuplicate = function(id, url) { return AdminClient.doDuplicate(id, url); };
  window.doEnableLink = function(id) { return AdminClient.doEnableLink(id); };
  window.doEnableSlug = function(id) { return AdminClient.doEnableSlug(id); };
  window.doSetPrimary = function(id, sid) { return AdminClient.doSetPrimary(id, sid); };
  window.downloadQrPng = function(slug) { return AdminClient.downloadQrPng(slug); };
  window.downloadQrSvg = function(slug) { return AdminClient.downloadQrSvg(slug); };
  window.showDisableLinkModal = function(id) { return AdminClient.showDisableLinkModal(id); };
  window.showDeleteLinkModal = function(id) { return AdminClient.showDeleteLinkModal(id); };
  window.showEnableLinkModal = function(id) { return AdminClient.showEnableLinkModal(id); };
  window.showAddSlugModal = function(linkId) { return AdminClient.showAddSlugModal(linkId); };
  window.showChangePrimaryModal = function(linkId) { return AdminClient.showChangePrimaryModal(linkId); };
  window.showDuplicateModal = function(linkId, url) { return AdminClient.showDuplicateModal(linkId, url); };
  window.showAddToBundleModal = function(linkId) { return AdminClient.showAddToBundleModal(linkId); };
  window.removeLinkFromBundle = function(bid, lid) { return AdminClient.removeLinkFromBundle(bid, lid); };
  window.showCreateBundleForLink = function(linkId) { return AdminClient.showCreateBundleForLink(linkId); };
  window.toggleAddToBundleRow = function(el) { return AdminClient.toggleAddToBundleRow(el); };
  window.saveAddToBundle = function(linkId) { return AdminClient.saveAddToBundle(linkId); };
  window.showAddLinkToBundlePicker = function(bundleId, excludeIds) { return AdminClient.showAddLinkToBundlePicker(bundleId, excludeIds); };
  window.filterBundleLinkPicker = function() { return AdminClient.filterBundleLinkPicker(); };
  window.doAddLinkToBundle = function(bundleId, linkId) { return AdminClient.doAddLinkToBundle(bundleId, linkId); };

  // Log successful initialization
  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[Admin Client] Module initialized successfully with ' + 
                  Object.keys(AdminClient).length + ' functions available');
  }

})();
`;
}
