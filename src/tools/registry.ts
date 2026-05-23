import type { Locale } from "@/i18n";
import type { ToolMeta } from "./types";

import { meta as base64Text } from "./base64-text/meta";
import { meta as cidr } from "./cidr/meta";
import { meta as imageBase64 } from "./image-base64/meta";
import { meta as imageConvert } from "./image-convert/meta";
import { meta as qrGenerate } from "./qr-generate/meta";
import { meta as dnsLookup } from "./dns-lookup/meta";
import { meta as rdap } from "./rdap/meta";
import { meta as exif } from "./exif/meta";
import { meta as ipGeo } from "./ip-geo/meta";
import { meta as password } from "./password/meta";
import { meta as uuid } from "./uuid/meta";
import { meta as cron } from "./cron/meta";
import { meta as regexTest } from "./regex-test/meta";
import { meta as timestamp } from "./timestamp/meta";
import { meta as timezone } from "./timezone/meta";
import { meta as caseConvert } from "./case-convert/meta";
import { meta as formatCode } from "./format-code/meta";
import { meta as hashText } from "./hash-text/meta";
import { meta as jsonCsv } from "./json-csv/meta";
import { meta as jsonDiff } from "./json-diff/meta";
import { meta as jsonToTypes } from "./json-to-types/meta";
import { meta as jsonViewer } from "./json-viewer/meta";
import { meta as markdownEditor } from "./markdown-editor/meta";
import { meta as jsonYaml } from "./json-yaml/meta";
import { meta as jwtDecode } from "./jwt-decode/meta";
import { meta as jwtGenerate } from "./jwt-generate/meta";
import { meta as sqlFormat } from "./sql-format/meta";
import { meta as textDiff } from "./text-diff/meta";
import { meta as urlEncode } from "./url-encode/meta";
import { meta as urlParse } from "./url-parse/meta";

/**
 * Every tool on the site, in one list.
 *
 * Adding a tool is a folder under `src/tools/` and one line here; the home
 * page, the search box, the command palette, the sitemap, the per-page
 * metadata and the sidebar are all derived from this array.
 * Nothing else enumerates tools.
 */
export const TOOLS: ToolMeta[] = [
  base64Text,
  urlEncode,
  urlParse,
  hashText,
  jwtDecode,
  jwtGenerate,
  { ...formatCode, weight: 1 },
  sqlFormat,
  jsonYaml,
  jsonCsv,
  jsonToTypes,
  caseConvert,
  textDiff,
  jsonDiff,
  regexTest,
  timestamp,
  cron,
  timezone,
  uuid,
  password,
  cidr,
  dnsLookup,
  rdap,
  ipGeo,
  imageConvert,
  exif,
  imageBase64,
  qrGenerate,
  { ...jsonViewer, weight: 2 },
  markdownEditor,
];

export const TOOL_BY_ID: Map<string, ToolMeta> = new Map(
  TOOLS.map((tool) => [tool.id, tool]),
);

export function getTool(id: string): ToolMeta | undefined {
  return TOOL_BY_ID.get(id);
}

/**
 * Ranks tools against what was typed.
 *
 * Both languages' names and keywords are searched whichever locale is active:
 * the words people reach for here are English half the time even in Turkish
 * ("hash", "encode"), and a search that finds nothing because the interface is
 * in the other language is the fastest way to lose someone.
 *
 * Every word of the query has to match somewhere, so "json yaml" or
 * "base64 decode" narrows rather than finding nothing.
 */
export function searchTools(query: string, locale: Locale): ToolMeta[] {
  const needle = normalize(query);
  const tokens = tokenize(needle);
  if (tokens.length === 0) return TOOLS;

  return TOOLS.map((tool) => ({
    tool,
    score: score(tool, needle, tokens, locale),
  }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.tool.weight ?? 0) - (a.tool.weight ?? 0) ||
        a.tool.id.localeCompare(b.tool.id),
    )
    .map((entry) => entry.tool);
}

const STOP_WORDS = new Set(["to", "ve", "->", "→"]);

function tokenize(needle: string): string[] {
  return needle
    .replace(/->|→/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

/**
 * Case- and accent-insensitive, so "cozumle" finds "çözümle".
 *
 * Turkish needs the explicit locale: the default lowercase maps "I" to "i"
 * rather than "ı", which breaks half the words that start with it.
 */
function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

function score(
  tool: ToolMeta,
  needle: string,
  tokens: string[],
  locale: Locale,
): number {
  const fields = {
    primary: normalize(tool.name[locale]),
    secondary: normalize(tool.name[locale === "tr" ? "en" : "tr"]),
    keywords: [...tool.keywords.tr, ...tool.keywords.en].map(normalize),
    blurb: normalize(tool.blurb[locale]),
  };

  let total = 0;
  for (const token of tokens) {
    const points = tokenScore(fields, token);
    if (points === 0) return 0;
    total += points;
  }

  if (fields.primary === needle) total += 100;
  else if (fields.primary.startsWith(needle)) total += 80;
  return total;
}

function tokenScore(
  fields: {
    primary: string;
    secondary: string;
    keywords: string[];
    blurb: string;
  },
  token: string,
): number {
  const { primary, secondary, keywords, blurb } = fields;
  if (primary === token) return 100;
  if (primary.startsWith(token)) return 80;
  if (keywords.some((word) => word === token)) return 70;
  if (primary.includes(token)) return 50;
  if (secondary.includes(token)) return 40;
  if (keywords.some((word) => word.includes(token))) return 30;
  if (blurb.includes(token)) return 10;
  return 0;
}
