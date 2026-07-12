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
  ].join("|"),
  "i",
);

export function isBot(ua: string): boolean {
  if (!ua || ua.trim() === "") return true;
  return BOT_PATTERNS.test(ua);
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
