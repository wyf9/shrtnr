// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

import type { FC } from "hono/jsx";
import type { TranslateFn } from "../i18n";
import { DynamicRedirectRule } from "../redirect-rules";
import { escHtml } from "../escape";

type Props = {
  rules: DynamicRedirectRule[];
  t: TranslateFn;
  lang: string;
};

// Helper to render rule parts with syntax highlighting
function renderRulePart(part: string): any {
  // Highlight :placeholder and * splat with different colors
  const tokens: any[] = [];
  let lastIndex = 0;
  
  // Match :placeholder or * 
  const regex = /(:[\w]+|\*)/g;
  let match;
  
  while ((match = regex.exec(part)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      tokens.push(part.substring(lastIndex, match.index));
    }
    // Add highlighted match
    const token = match[0];
    if (token === "*") {
      tokens.push(<span class="syntax-splat">{token}</span>);
    } else {
      tokens.push(<span class="syntax-placeholder">{token}</span>);
    }
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < part.length) {
    tokens.push(part.substring(lastIndex));
  }
  
  return tokens.length > 0 ? tokens : part;
}

export const RedirectsPage: FC<Props> = ({ rules, t, lang }) => {
  return (
    <>
      <div class="page-header topbar">
        <div>
          <div class="page-title">{t("redirects.title")}</div>
          <div class="page-subtitle">{t("redirects.subtitle")}</div>
        </div>
      </div>

      <div class="hero-input-wrap">
        <div class="hero-input-row hero-input-row-primary">
          <input
            class="hero-input"
            id="quick-rule-source"
            type="text"
            placeholder={t("redirects.sourcePattern")}
          />
          <input
            class="hero-input"
            id="quick-rule-dest"
            type="text"
            placeholder={t("redirects.destinationUrl")}
          />
          <button class="btn btn-primary btn-lg" id="quick-rule-btn" onclick="addRedirectRule()">
            <span class="icon">add</span> {t("redirects.add")}
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div class="empty-state">
          <span class="icon">alt_route</span>
          <p>{t("redirects.empty")}</p>
        </div>
      ) : (
        <div class="bento-card bento-card-flush">
          <div class="redirects-table-scroll">
            <table class="redirects-table">
              <thead>
                <tr>
                  <th>{t("redirects.colSource")}</th>
                  <th>{t("redirects.colDestination")}</th>
                  <th>{t("redirects.colStatus")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => (
                  <tr class="redirect-row">
                    <td data-label={t("redirects.colSource")}>
                      <code class="redirect-rule-code">
                        {renderRulePart(rule.source)}
                      </code>
                    </td>
                    <td data-label={t("redirects.colDestination")}>
                      <code class="redirect-rule-code">
                        {renderRulePart(rule.destination)}
                      </code>
                    </td>
                    <td data-label={t("redirects.colStatus")} class="col-status">
                      {rule.status}
                    </td>
                    <td class="col-actions">
                      <button
                        class="btn btn-ghost btn-sm no-row-nav"
                        onclick={`deleteRedirectRule(${idx})`}
                        title={t("redirects.delete")}
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
