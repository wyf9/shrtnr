// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

const VALID_REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const PARAM_NAME_RE = /^[A-Za-z][A-Za-z0-9_]*$/;
const PARAM_TOKEN_RE = /:([A-Za-z][A-Za-z0-9_]*)/g;

type RuleToken =
  | { kind: "literal"; value: string }
  | { kind: "param"; name: string }
  | { kind: "splat" };

export type DynamicRedirectRule = {
  source: string;
  destination: string;
  status: number;
  tokens: RuleToken[];
};

export type DynamicRedirectParseResult =
  | { ok: true; rules: DynamicRedirectRule[] }
  | { ok: false; error: string };

export type DynamicRedirectMatch = {
  url: string;
  status: number;
};

function tokenizePattern(source: string): RuleToken[] {
  if (!source.startsWith("/")) {
    throw new Error("source path must start with '/'");
  }
  if (source === "/") return [];

  const segments = source.slice(1).split("/");
  const tokens: RuleToken[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment === "*") {
      if (i !== segments.length - 1) {
        throw new Error("splat '*' is only supported as the last segment");
      }
      tokens.push({ kind: "splat" });
      continue;
    }

    if (segment.startsWith(":")) {
      const name = segment.slice(1);
      if (!PARAM_NAME_RE.test(name)) {
        throw new Error(`invalid placeholder name ':${name}'`);
      }
      tokens.push({ kind: "param", name });
      continue;
    }

    if (segment.includes(":") || segment.includes("*")) {
      throw new Error(`invalid wildcard syntax in segment '${segment}'`);
    }
    tokens.push({ kind: "literal", value: segment });
  }

  return tokens;
}

function validateDestination(destination: string): void {
  if (!destination) throw new Error("destination must not be empty");
  try {
    const absolute = new URL(destination);
    if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
      throw new Error("destination URL must use http or https");
    }
    return;
  } catch {
    if (!destination.startsWith("/")) {
      throw new Error("destination must be an absolute http(s) URL or start with '/'");
    }
  }
}

function parseRuleLine(line: string): DynamicRedirectRule {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2 || parts.length > 3) {
    throw new Error("rule must have 2 or 3 columns: <source> <destination> [status]");
  }

  const source = parts[0];
  const destination = parts[1];
  const status = parts[2] ? parseInt(parts[2], 10) : 302;
  if (!Number.isInteger(status) || !VALID_REDIRECT_STATUS.has(status)) {
    throw new Error("status must be one of 301, 302, 303, 307, 308");
  }

  validateDestination(destination);
  const tokens = tokenizePattern(source);

  return { source, destination, status, tokens };
}

export function parseDynamicRedirectRules(raw: string | null | undefined): DynamicRedirectParseResult {
  if (!raw || !raw.trim()) return { ok: true, rules: [] };

  const lines = raw.split(/\r?\n/);
  const rules: DynamicRedirectRule[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    try {
      rules.push(parseRuleLine(line));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: `Invalid redirect rule at line ${i + 1}: ${message}` };
    }
  }

  return { ok: true, rules };
}

function splitPath(pathname: string): string[] {
  if (pathname === "/") return [];
  return (pathname.startsWith("/") ? pathname.slice(1) : pathname).split("/");
}

function applyDestinationTemplate(destination: string, params: Record<string, string>): string {
  return destination.replace(PARAM_TOKEN_RE, (all, key) => (params[key] !== undefined ? params[key] : all));
}

function resolveDestination(destination: string, requestUrl: string): string {
  try {
    const absolute = new URL(destination);
    return absolute.toString();
  } catch {
    return new URL(destination, requestUrl).toString();
  }
}

export function matchDynamicRedirect(
  rules: DynamicRedirectRule[],
  pathname: string,
  requestUrl: string,
): DynamicRedirectMatch | null {
  const pathSegments = splitPath(pathname);

  for (const rule of rules) {
    const params: Record<string, string> = {};
    let segmentIndex = 0;
    let matched = true;

    for (const token of rule.tokens) {
      if (token.kind === "splat") {
        params.splat = pathSegments.slice(segmentIndex).join("/");
        segmentIndex = pathSegments.length;
        break;
      }

      const segment = pathSegments[segmentIndex];
      if (segment === undefined) {
        matched = false;
        break;
      }

      if (token.kind === "literal") {
        if (segment !== token.value) {
          matched = false;
          break;
        }
      } else {
        params[token.name] = segment;
      }
      segmentIndex++;
    }

    if (!matched || segmentIndex !== pathSegments.length) continue;

    const templated = applyDestinationTemplate(rule.destination, params);
    return { url: resolveDestination(templated, requestUrl), status: rule.status };
  }

  return null;
}
