import type { Localized } from "@/i18n";
import {
  ToolError,
  type ResultGroup,
  type ResultRow,
  type TextResult,
} from "../text-tool";

/**
 * Takes a URL apart, including the query string.
 *
 * `new URL` is the parser — it is the same one the browser uses, so the answer
 * matches what a request would actually do rather than what a regex thinks.
 * Values are shown decoded, because the reason to open this tool is usually to
 * read a value that is unreadable encoded.
 */
const RELATIVE_BASE = "http://relative.invalid";
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const HOST_PORT = /^[^/?#:@\s]+:\d+(?:[/?#]|$)/;
const BARE_HOST =
  /^(?:[^/?#:@\s]+\.[^/?#:@\s.]+|localhost)(?::\d+)?(?:[/?#]|$)/i;

export type UrlKind = "absolute" | "relative" | "schemeless";

export function classify(input: string): UrlKind | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[/?#]/.test(trimmed) && !trimmed.startsWith("//")) return "relative";
  if (SCHEME.test(trimmed) && !HOST_PORT.test(trimmed)) return "absolute";
  return BARE_HOST.test(trimmed) ? "schemeless" : "absolute";
}

const EMPTY: Localized = { tr: "(boş)", en: "(empty)" };

function row(label: string, value: string, hint?: Localized): ResultRow {
  return value === ""
    ? { label, value, hint: EMPTY }
    : hint
      ? { label, value, hint }
      : { label, value };
}

export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseUrl(input: string): TextResult {
  const trimmed = input.trim();
  const kind = classify(trimmed);
  if (!kind) return { text: "" };

  let url: URL;
  try {
    url =
      kind === "relative"
        ? new URL(trimmed, RELATIVE_BASE)
        : new URL(kind === "schemeless" ? `https://${trimmed}` : trimmed);
  } catch {
    throw new ToolError({
      tr: "Geçerli bir URL değil. Şema eksik olabilir (https:// gibi).",
      en: "Not a valid URL. The scheme may be missing (https://, say).",
    });
  }

  const parts: ResultRow[] = [];
  if (kind !== "relative") {
    const host = hostToUnicode(url.hostname);
    if (url.origin !== "null") {
      parts.push(row("origin", originToUnicode(url, host)));
    }
    parts.push(row("scheme", url.protocol.replace(/:$/, "")));
    if (url.hostname) {
      parts.push(row("host", url.port ? `${host}:${url.port}` : host));
      if (host !== url.hostname) parts.push(row("host (ASCII)", url.hostname));
      const fallback = defaultPort(url.protocol);
      if (url.port) parts.push(row("port", url.port));
      else if (fallback) {
        parts.push(row("port", fallback, { tr: "varsayılan", en: "default" }));
      }
    }
    if (url.username) parts.push(row("user", safeDecode(url.username)));
    // Never printed back: a password in a URL is the one part of it that should
    // not end up in a screenshot or a paste.
    if (url.password) {
      parts.push(row("password", "•".repeat(8), { tr: "gizli", en: "hidden" }));
    }
  }
  parts.push(row("path", safeDecode(url.pathname)));
  if (url.search) parts.push(row("search", url.search));
  if (url.hash) parts.push(row("fragment", safeDecode(url.hash.slice(1))));

  const groups: ResultGroup[] = [
    { label: { tr: "Parçalar", en: "Parts" }, rows: parts },
  ];

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length > 1) {
    groups.push({
      label: {
        tr: `Path segmentleri (${segments.length})`,
        en: `Path segments (${segments.length})`,
      },
      rows: segments.map((segment, index) =>
        row(String(index + 1), safeDecode(segment)),
      ),
    });
  }

  const params = [...url.searchParams.entries()];
  if (params.length > 0) {
    const counts = new Map<string, number>();
    for (const [key] of params) counts.set(key, (counts.get(key) ?? 0) + 1);
    const seen = new Map<string, number>();
    const rows = params.map(([key, value]) => {
      const index = seen.get(key) ?? 0;
      seen.set(key, index + 1);
      const name = key === "" ? "(—)" : key;
      return row(counts.get(key)! > 1 ? `${name} [${index}]` : name, value);
    });
    groups.push({
      label: {
        tr: `Query (${params.length})`,
        en: `Query (${params.length})`,
      },
      rows,
    });
  }

  return { text: toText(groups), groups };
}

function toText(groups: ResultGroup[]): string {
  const rows = groups.flatMap((group) => group.rows);
  const width = Math.max(
    ...rows.map((r) => (typeof r.label === "string" ? r.label.length : 0)),
    0,
  );
  return groups
    .map((group, index) => {
      const lines = group.rows.map((r) =>
        `${String(r.label).padEnd(width)}  ${r.value}`.trimEnd(),
      );
      if (index === 0) return lines.join("\n");
      const title =
        typeof group.label === "string" ? group.label : group.label.en;
      return [title.toLowerCase(), ...lines.map((line) => `  ${line}`)].join(
        "\n",
      );
    })
    .join("\n\n");
}

function originToUnicode(url: URL, host: string): string {
  return url.origin.replace(url.hostname, host);
}

function defaultPort(protocol: string): string {
  if (protocol === "https:" || protocol === "wss:") return "443";
  if (protocol === "http:" || protocol === "ws:") return "80";
  if (protocol === "ftp:") return "21";
  return "";
}

export function hostToUnicode(host: string): string {
  return host
    .split(".")
    .map((label) => {
      if (!/^xn--/i.test(label)) return label;
      try {
        return decodePunycode(label.slice(4).toLowerCase());
      } catch {
        return label;
      }
    })
    .join(".");
}

/** RFC 3492 decoding, for the `xn--` labels of an internationalized host. */
export function decodePunycode(input: string): string {
  const base = 36;
  const tMin = 1;
  const tMax = 26;
  const skew = 38;
  const damp = 700;

  const adapt = (delta: number, points: number, first: boolean) => {
    delta = first ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / points);
    let k = 0;
    while (delta > ((base - tMin) * tMax) >> 1) {
      delta = Math.floor(delta / (base - tMin));
      k += base;
    }
    return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
  };
  const digit = (code: number) => {
    if (code >= 48 && code <= 57) return code - 22;
    if (code >= 97 && code <= 122) return code - 97;
    throw new Error("punycode");
  };

  const split = input.lastIndexOf("-");
  const output =
    split >= 0 ? [...input.slice(0, split)].map((c) => c.codePointAt(0)!) : [];
  let n = 128;
  let i = 0;
  let bias = 72;
  let position = split >= 0 ? split + 1 : 0;

  while (position < input.length) {
    const old = i;
    let w = 1;
    for (let k = base; ; k += base) {
      if (position >= input.length) throw new Error("punycode");
      const d = digit(input.charCodeAt(position++));
      i += d * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (d < t) break;
      w *= base - t;
    }
    bias = adapt(i - old, output.length + 1, old === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    if (n > 0x10ffff) throw new Error("punycode");
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
}
