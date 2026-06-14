// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { FC } from "hono/jsx";
import type { TranslateFn } from "../i18n";
import type { Page } from "../types";

type Props = {
  pages: Page[];
  t: TranslateFn;
  lang: string;
};

export const PagesPage: FC<Props> = ({ pages, t }) => {
  return (
    <>
      <div class="page-header topbar">
        <div>
          <div class="page-title">{t("pages.title")}</div>
          <div class="page-subtitle">{t("pages.subtitle")}</div>
        </div>
      </div>

      <div class="hero-input-wrap">
        <div class="hero-input-row hero-input-row-primary">
          <input
            class="hero-input"
            id="quick-page-slug"
            type="text"
            placeholder={t("pages.slugPlaceholder")}
          />
          <input
            class="hero-input"
            id="quick-page-filename"
            type="text"
            placeholder={t("pages.filenamePlaceholder")}
          />
          <button class="btn btn-primary btn-lg" id="quick-page-btn" onclick="AdminClient.showCreatePageModal()">
            <span class="icon">add</span> {t("pages.add")}
          </button>
        </div>
      </div>

      {pages.length === 0 ? (
        <div class="empty-state">
          <span class="icon">description</span>
          <p>{t("pages.empty")}</p>
        </div>
      ) : (
        <div class="bento-card bento-card-flush">
          <div class="redirects-table-scroll">
            <table class="redirects-table">
              <thead>
                <tr>
                  <th>{t("pages.colSlug")}</th>
                  <th>{t("pages.colFilename")}</th>
                  <th>{t("pages.colStatus")}</th>
                  <th>{t("pages.colHeaders")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr class={`redirect-row${page.disabled_at ? " muted" : ""}`}>
                    <td data-label={t("pages.colSlug")}>
                      <code class="redirect-rule-code">/{page.slug}</code>
                      {page.disabled_at ? (
                        <span class="badge badge-disabled">{t("pages.disabled")}</span>
                      ) : null}
                    </td>
                    <td data-label={t("pages.colFilename")}>
                      <span class="text-mono">{page.filename}</span>
                    </td>
                    <td data-label={t("pages.colStatus")}>
                      <code>{page.http_status}</code>
                    </td>
                    <td data-label={t("pages.colHeaders")}>
                      <code class="text-mono text-sm">
                        {page.headers === "{}" ? "—" : page.headers}
                      </code>
                    </td>
                    <td class="col-actions">
                      <button
                        class="btn btn-ghost btn-sm no-row-nav"
                        onclick={`AdminClient.showEditPageModal(${page.id}, ${JSON.stringify(page.slug)}, ${JSON.stringify(page.filename)}, ${page.http_status}, ${JSON.stringify(page.headers)}, ${JSON.stringify(page.content)})`}
                        title={t("pages.edit")}
                      >
                        <span class="icon icon-sm">edit</span>
                      </button>
                      {page.disabled_at ? (
                        <button
                          class="btn btn-ghost btn-sm no-row-nav"
                          onclick={`AdminClient.enablePage(${page.id})`}
                          title={t("pages.enable")}
                        >
                          <span class="icon icon-sm">toggle_on</span>
                        </button>
                      ) : (
                        <button
                          class="btn btn-ghost btn-sm no-row-nav"
                          onclick={`AdminClient.disablePage(${page.id})`}
                          title={t("pages.disable")}
                        >
                          <span class="icon icon-sm">toggle_off</span>
                        </button>
                      )}
                      <button
                        class="btn btn-ghost btn-sm no-row-nav"
                        onclick={`AdminClient.deletePage(${page.id}, ${JSON.stringify(page.slug)})`}
                        title={t("pages.delete")}
                      >
                        <span class="icon icon-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};
