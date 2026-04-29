// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { FC } from "hono/jsx";
import type { TranslateFn } from "../i18n";
import { escHtml } from "../escape";

function formatDate(ts: number, lang: string): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ApiKey = {
  id: number;
  title: string;
  key_prefix: string;
  scope: string;
  created_at: number;
  last_used_at: number | null;
};

type Props = {
  keys: ApiKey[];
  t: TranslateFn;
  lang: string;
};

export const KeysPage: FC<Props> = ({ keys, t, lang }) => {
  const countKey = keys.length !== 1 ? "keys.countPlural" : "keys.count";

  return (
    <>
      <div class="page-header">
        <div class="page-title">{t("keys.title")}</div>
        <div class="page-subtitle">
          {t("keys.subtitle")}
        </div>
        <div class="page-note">
          {t("keys.docsNote")}{" "}
          <a href="/_/api/docs">
            {t("keys.docsLink")}
          </a>
        </div>
      </div>

      <div class="toolbar">
        <div class="toolbar-count">
          {t(countKey as any, { count: keys.length })}
        </div>
        <button class="btn btn-primary" onclick="showCreateKeyModal()">
          <span class="icon">add</span> {t("keys.newKey")}
        </button>
      </div>

      {keys.length === 0 ? (
        <div class="empty-state">
          <span class="icon">key_off</span>
          <p>
            {t("keys.empty")}
          </p>
        </div>
      ) : (
        <div class="bento-card bento-card-flush">
          <div class="keys-table-scroll">
            <table class="keys-table">
              <thead>
                <tr>
                  <th>{t("keys.colTitle")}</th>
                  <th>{t("keys.colKey")}</th>
                  <th>{t("keys.colScope")}</th>
                  <th>{t("keys.colCreated")}</th>
                  <th>{t("keys.colLastUsed")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => {
                  const scopes = k.scope.split(",");
                  return (
                    <tr>
                      <td data-label={t("keys.colTitle")} class="col-title">{k.title}</td>
                      <td data-label={t("keys.colKey")}>
                        <span class="col-key-prefix">{k.key_prefix}&hellip;</span>
                      </td>
                      <td data-label={t("keys.colScope")}>
                        {scopes.map((s) => (
                          <span class={`scope-badge ${s}`}>{s} </span>
                        ))}
                      </td>
                      <td data-label={t("keys.colCreated")} class="col-date">
                        {formatDate(k.created_at, lang)}
                      </td>
                      <td data-label={t("keys.colLastUsed")} class="col-last-used">
                        {k.last_used_at ? (
                          formatDate(k.last_used_at, lang)
                        ) : (
                          <span class="col-never">{t("keys.never")}</span>
                        )}
                      </td>
                      <td>
                        <button
                          class="btn btn-danger btn-sm"
                          onclick={`deleteKey(${k.id},'${escHtml(k.title).replace(/'/g, "\\'")}')`}
                        >
                          <span class="icon icon-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};
