/**
 * What a User-Agent string is claiming.
 *
 * Every browser lies in this header for compatibility — Chrome says it is
 * Safari, which says it is Gecko, which says it is Mozilla — so the order the
 * tokens are checked in matters: Edge before Chrome, Chrome before Safari.
 * Getting that order wrong is why so many analytics dashboards over-count
 * Safari.
 */
export function parseUserAgent(input: string): string {
  const ua = input.trim();
  if (!ua) return "";

  const rows: [string, string][] = [
    ["browser", browser(ua)],
    ["engine", engine(ua)],
    ["os", operatingSystem(ua)],
    ["device", device(ua)],
    ["bot", bot(ua) ?? "—"],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return [
    ...rows.map(([label, value]) => `${label.padEnd(width)}  ${value}`),
    "",
    ua,
  ].join("\n");
}

function browser(ua: string): string {
  const checks: [RegExp, string][] = [
    [/Edg(?:e|A|iOS)?\/([\d.]+)/, "Edge"],
    [/OPR\/([\d.]+)/, "Opera"],
    [/SamsungBrowser\/([\d.]+)/, "Samsung Internet"],
    [/YaBrowser\/([\d.]+)/, "Yandex"],
    [/Firefox\/([\d.]+)/, "Firefox"],
    [/FxiOS\/([\d.]+)/, "Firefox iOS"],
    [/CriOS\/([\d.]+)/, "Chrome iOS"],
    [/Chrome\/([\d.]+)/, "Chrome"],
    [/Version\/([\d.]+).*Safari/, "Safari"],
    [/MSIE ([\d.]+)/, "Internet Explorer"],
    [/Trident.*rv:([\d.]+)/, "Internet Explorer"],
  ];

  for (const [pattern, name] of checks) {
    const match = pattern.exec(ua);
    if (match) return `${name} ${match[1]}`;
  }
  return "—";
}

function engine(ua: string): string {
  if (/Gecko\/|Firefox\//.test(ua) && !/like Gecko/.test(ua)) return "Gecko";
  if (/AppleWebKit\/([\d.]+)/.test(ua)) {
    return /Chrome\/|Edg\/|OPR\//.test(ua) ? "Blink" : "WebKit";
  }
  if (/Trident/.test(ua)) return "Trident";
  return "—";
}

function operatingSystem(ua: string): string {
  const checks: [RegExp, (match: RegExpExecArray) => string][] = [
    [/Windows NT ([\d.]+)/, (m) => `Windows ${WINDOWS[m[1]] ?? m[1]}`],
    [/Android ([\d.]+)/, (m) => `Android ${m[1]}`],
    [/iPhone OS ([\d_]+)/, (m) => `iOS ${m[1].replace(/_/g, ".")}`],
    [/CPU OS ([\d_]+)/, (m) => `iPadOS ${m[1].replace(/_/g, ".")}`],
    [/Mac OS X ([\d_]+)/, (m) => `macOS ${m[1].replace(/_/g, ".")}`],
    [/CrOS \S+ ([\d.]+)/, (m) => `ChromeOS ${m[1]}`],
    [/Linux/, () => "Linux"],
  ];

  for (const [pattern, describe] of checks) {
    const match = pattern.exec(ua);
    if (match) return describe(match);
  }
  return "—";
}

const WINDOWS: Record<string, string> = {
  "10.0": "10 / 11",
  "6.3": "8.1",
  "6.2": "8",
  "6.1": "7",
};

function device(ua: string): string {
  if (/iPad/.test(ua)) return "tablet (iPad)";
  if (/iPhone/.test(ua)) return "phone (iPhone)";
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? "phone" : "tablet";
  if (/Mobile|Windows Phone/.test(ua)) return "phone";
  return "desktop";
}

function bot(ua: string): string | null {
  const match =
    /(Googlebot|bingbot|DuckDuckBot|Baiduspider|YandexBot|Slurp|facebookexternalhit|Twitterbot|Applebot|AhrefsBot|SemrushBot|curl|wget|python-requests|PostmanRuntime|GPTBot|ClaudeBot|CCBot)/i.exec(
      ua,
    );
  return match ? match[1] : null;
}
