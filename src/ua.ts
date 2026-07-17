// Copyright 2026 Oddbit (https://oddbit.id)
// SPDX-License-Identifier: Apache-2.0

/**
 * Lightweight User-Agent parsing. No dependencies.
 * Covers the major browsers and device types for analytics.
 */

export function parseDeviceType(ua: string): string {
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) return "mobile";
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return "tablet";
  return "desktop";
}

export function parseOS(ua: string): string {
  // Order matters: check more specific patterns first
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/CrOS/.test(ua)) return "chromeos";
  if (/Mac OS X|Macintosh/.test(ua)) return "macos";
  if (/Linux/.test(ua)) return "linux";
  return "other";
}

// AI model-training and content-ingestion crawlers. Most already carry a
// "bot"/"crawl"/"spider" token and match BOT_PATTERNS, but several identify
// with tokens that do not (Google-Extended, anthropic-ai, cohere-ai, ...), so
// list them explicitly to guarantee the bot filter catches AI crawler traffic.
// These pull pages to build datasets; they are distinct from the live,
// user-triggered AI searches handled by AI_SEARCH_PATTERNS below.
const AI_CRAWLER_TOKENS = [
  "gptbot",
  "ccbot",
  "claudebot",
  "anthropic-ai",
  "google-extended",
  "applebot-extended",
  "bytespider",
  "meta-externalagent",
  "facebookbot",
  "amazonbot",
  "cohere-ai",
  "cohere-training-data-crawler",
  "perplexitybot",
  "diffbot",
  "omgili",
  "omgilibot",
  "img2dataset",
  "timpibot",
  "youbot",
  "imagesiftbot",
  "petalbot",
  "scrapy",
];

const BOT_PATTERNS = new RegExp(
  [
    "bot\\b",
    "crawl",
    "spider",
    "slurp",
    "facebookexternalhit",
    "mediapartners",
    "embedly",
    "feedfetcher",
    "whatsapp",
    "skypeuri",
    "preview",
    "curl/",
    "wget/",
    "python-requests",
    "go-http-client",
    "java/",
    "okhttp",
    "axios/",
    "node-fetch",
    "headlesschrome",
    "puppeteer",
    "phantomjs",
    "selenium",
    "lighthouse",
    "pagespeed",
    ...AI_CRAWLER_TOKENS,
  ].join("|"),
  "i",
);

export function isBot(ua: string): boolean {
  if (!ua || ua.trim() === "") return true;
  return BOT_PATTERNS.test(ua);
}

// Live AI searches and assistant fetches triggered when a person asks an AI
// tool (or an agent acting on their behalf) to look something up, distinct
// from the training crawlers above. These come from real prompts, so the
// dashboard filters them separately from generic bot traffic.
const AI_SEARCH_PATTERNS = new RegExp(
  [
    "chatgpt-user",
    "oai-searchbot",
    "perplexity-user",
    "claude-user",
    "claude-web",
    "claude-searchbot",
    "duckassistbot",
    "meta-externalfetcher",
    "google-cloudvertexbot",
    "gemini-user",
    "bingbot-assistant",
  ].join("|"),
  "i",
);

/**
 * True when the request comes from an AI assistant or AI search performing a
 * live lookup on behalf of a user or agent (for example ChatGPT-User,
 * Perplexity-User, Claude-User). Training crawlers such as GPTBot are handled
 * by {@link isBot}, not here.
 */
export function isAiSearch(ua: string): boolean {
  if (!ua) return false;
  return AI_SEARCH_PATTERNS.test(ua);
}

// Command-line tools, HTTP libraries, and API clients. These do not identify as
// browsers, so without special handling they all collapse into "Other". We
// surface them under their own label in the Browsers breakdown instead. Order
// matters: more specific tokens are matched before generic ones (for example
// "python-requests" before a bare runtime match). Matching is case-insensitive
// because these User-Agents are not consistently cased across versions.
const CLI_CLIENT_PATTERNS: [RegExp, string][] = [
  [/curl\//i, "curl"],
  [/wget\//i, "Wget"],
  [/HTTPie\//i, "HTTPie"],
  [/PostmanRuntime\//i, "Postman"],
  [/insomnia\//i, "Insomnia"],
  [/RestSharp\//i, "RestSharp"],
  [/python-requests\//i, "Python Requests"],
  [/aiohttp\//i, "aiohttp"],
  [/httpx\//i, "HTTPX"],
  [/python-urllib|urllib\//i, "Python urllib"],
  [/Go-http-client\//i, "Go-http-client"],
  [/okhttp\//i, "OkHttp"],
  [/Apache-HttpClient\//i, "Apache HttpClient"],
  [/Java\//i, "Java"],
  [/axios\//i, "axios"],
  [/node-fetch\//i, "node-fetch"],
  [/undici\//i, "undici"],
  [/got\s*\(|got\//i, "got"],
  [/libwww-perl|lwp::/i, "Perl LWP"],
  [/Guzzle(?:Http)?\//i, "Guzzle"],
  [/PHP\//i, "PHP"],
  [/ruby$|Ruby\/|rest-client\//i, "Ruby"],
  [/Deno\//i, "Deno"],
  [/Bun\//i, "Bun"],
  [/(?:Windows)?PowerShell\//i, "PowerShell"],
  [/WindowsPowerShell/i, "PowerShell"],
];

export function parseCliClient(ua: string): string | null {
  for (const [pattern, label] of CLI_CLIENT_PATTERNS) {
    if (pattern.test(ua)) return label;
  }
  return null;
}

export function parseBrowser(ua: string): string {
  // Order matters: check more specific patterns first
  if (/EdgA?\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser\//.test(ua)) return "Samsung Internet";
  if (/YaBrowser\//.test(ua)) return "Yandex";
  if (/Brave/.test(ua)) return "Brave";
  if (/Vivaldi\//.test(ua)) return "Vivaldi";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Chromium\//.test(ua)) return "Chromium";
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/MSIE|Trident/.test(ua)) return "IE";

  // Fall back to command-line / library clients before giving up as "Other" so
  // wget, curl, and friends show up as distinct entries in analytics.
  const cli = parseCliClient(ua);
  if (cli) return cli;

  return "Other";
}
