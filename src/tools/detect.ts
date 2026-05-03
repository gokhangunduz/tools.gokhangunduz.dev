import type { Localized } from "@/i18n";

/**
 * Recognises what was pasted into the search box.
 *
 * The box says "search tools, or paste something", and this is the half that
 * makes that true: a JWT, a hash, a timestamp or a base64 blob is matched to
 * the tool that reads it, so the common case — you have a value and do not
 * know what it is — takes one paste instead of a guess at a tool name.
 *
 * Order matters: a JWT is also valid base64url, and a hex digest is also a
 * valid hex string, so the specific patterns are tested before the general
 * ones.
 */
export type Detection = {
  toolId: string;
  label: Localized;
};

type Rule = {
  toolId: string;
  label: Localized;
  test: (value: string) => boolean;
};

const RULES: Rule[] = [
  {
    toolId: "jwt-decode",
    label: { tr: "JWT", en: "a JWT" },
    test: (value) =>
      /^[\w-]+\.[\w-]+\.[\w-]*$/.test(value) && value.startsWith("ey"),
  },
  {
    toolId: "uuid",
    label: { tr: "UUID", en: "a UUID" },
    test: (value) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
  },
  {
    toolId: "hash-text",
    label: { tr: "hash (MD5/SHA)", en: "a hash (MD5/SHA)" },
    test: (value) =>
      /^[0-9a-f]{32}$|^[0-9a-f]{40}$|^[0-9a-f]{64}$|^[0-9a-f]{128}$/i.test(
        value,
      ),
  },
  {
    toolId: "bcrypt",
    label: { tr: "bcrypt hash'i", en: "a bcrypt hash" },
    test: (value) => /^\$2[aby]?\$\d{2}\$/.test(value),
  },
  {
    toolId: "timestamp",
    label: { tr: "zaman damgası", en: "a timestamp" },
    test: (value) =>
      /^\d{10}$|^\d{13}$/.test(value) ||
      /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/.test(value),
  },
  {
    toolId: "cidr",
    label: { tr: "IP adresi / CIDR", en: "an IP address or CIDR" },
    test: (value) => /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(value),
  },
  {
    toolId: "url-parse",
    label: { tr: "URL", en: "a URL" },
    test: (value) => /^https?:\/\/\S+$/i.test(value),
  },
  {
    toolId: "json-viewer",
    label: { tr: "JSON", en: "JSON" },
    test: (value) => {
      if (!/^[[{]/.test(value)) return false;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    toolId: "user-agent",
    label: { tr: "User-Agent", en: "a User-Agent" },
    test: (value) => /^Mozilla\/\d/.test(value),
  },
  {
    toolId: "cron",
    label: { tr: "cron ifadesi", en: "a cron expression" },
    test: (value) =>
      /^(\S+\s+){4}\S+$/.test(value) &&
      /[*\/,-]/.test(value) &&
      !/[a-z]{4}/i.test(value),
  },
  {
    toolId: "svg-optimize",
    label: { tr: "SVG", en: "an SVG" },
    test: (value) => /^<svg[\s>]/i.test(value),
  },
  {
    toolId: "html-jsx",
    label: { tr: "HTML", en: "HTML" },
    test: (value) => /^<[a-z][\s\S]*>/i.test(value),
  },
  {
    toolId: "base64-text",
    label: { tr: "Base64", en: "Base64" },
    test: (value) =>
      value.length >= 12 &&
      value.length % 4 === 0 &&
      /^[A-Za-z0-9+/]+={0,2}$/.test(value) &&
      // A string of only hex digits is far more likely to be bytes than a
      // base64 payload that happens to avoid every other letter.
      !/^[0-9a-f]+$/i.test(value),
  },
  {
    toolId: "hex-text",
    label: { tr: "onaltılık bayt dizisi", en: "hex bytes" },
    test: (value) =>
      value.length >= 8 && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value),
  },
];

export function detect(input: string): Detection | null {
  const value = input.trim();
  // Below this length almost anything matches something, and a suggestion
  // that fires while you are still typing a tool's name is noise.
  if (value.length < 8) return null;

  const rule = RULES.find((entry) => entry.test(value));
  return rule ? { toolId: rule.toolId, label: rule.label } : null;
}
