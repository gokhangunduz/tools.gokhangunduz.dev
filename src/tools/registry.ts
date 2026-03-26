import type { Locale } from "@/i18n";
import { CATEGORIES } from "./categories";
import type { CategoryId, ToolMeta } from "./types";

import { meta as aes } from "./aes/meta";
import { meta as base64Text } from "./base64-text/meta";
import { meta as bcrypt } from "./bcrypt/meta";
import { meta as binaryText } from "./binary-text/meta";
import { meta as bitwise } from "./bitwise/meta";
import { meta as cidr } from "./cidr/meta";
import { meta as asciiTable } from "./ascii-table/meta";
import { meta as dockerCli } from "./docker-cli/meta";
import { meta as exif } from "./exif/meta";
import { meta as gitCommands } from "./git-commands/meta";
import { meta as httpHeaders } from "./http-headers/meta";
import { meta as regexCheatsheet } from "./regex-cheatsheet/meta";
import { meta as sqlJoin } from "./sql-join/meta";
import { meta as imageBase64 } from "./image-base64/meta";
import { meta as imageConvert } from "./image-convert/meta";
import { meta as qrGenerate } from "./qr-generate/meta";
import { meta as qrRead } from "./qr-read/meta";
import { meta as svgOptimize } from "./svg-optimize/meta";
import { meta as dnsLookup } from "./dns-lookup/meta";
import { meta as httpStatus } from "./http-status/meta";
import { meta as ipConvert } from "./ip-convert/meta";
import { meta as ipGeo } from "./ip-geo/meta";
import { meta as mimeType } from "./mime-type/meta";
import { meta as rdap } from "./rdap/meta";
import { meta as userAgent } from "./user-agent/meta";
import { meta as mockJson } from "./mock-json/meta";
import { meta as password } from "./password/meta";
import { meta as rsaKey } from "./rsa-key/meta";
import { meta as totp } from "./totp/meta";
import { meta as uuid } from "./uuid/meta";
import { meta as byteSize } from "./byte-size/meta";
import { meta as chmod } from "./chmod/meta";
import { meta as cron } from "./cron/meta";
import { meta as duration } from "./duration/meta";
import { meta as ieee754 } from "./ieee754/meta";
import { meta as jsonPath } from "./jsonpath/meta";
import { meta as jsonSchemaValidate } from "./json-schema-validate/meta";
import { meta as numberBase } from "./number-base/meta";
import { meta as regexTest } from "./regex-test/meta";
import { meta as semver } from "./semver/meta";
import { meta as timestamp } from "./timestamp/meta";
import { meta as timezone } from "./timezone/meta";
import { meta as validateTool } from "./validate/meta";
import { meta as caseConvert } from "./case-convert/meta";
import { meta as curlFetch } from "./curl-fetch/meta";
import { meta as dockerRunCompose } from "./docker-run-compose/meta";
import { meta as envJson } from "./env-json/meta";
import { meta as formatCode } from "./format-code/meta";
import { meta as gzip } from "./gzip/meta";
import { meta as hashText } from "./hash-text/meta";
import { meta as hexText } from "./hex-text/meta";
import { meta as hmac } from "./hmac/meta";
import { meta as htmlEntity } from "./html-entity/meta";
import { meta as htmlJsx } from "./html-jsx/meta";
import { meta as jsonCsv } from "./json-csv/meta";
import { meta as jsonToml } from "./json-toml/meta";
import { meta as jsonXml } from "./json-xml/meta";
import { meta as jsonDiff } from "./json-diff/meta";
import { meta as jsonToTypes } from "./json-to-types/meta";
import { meta as jsonViewer } from "./json-viewer/meta";
import { meta as llmToken } from "./llm-token/meta";
import { meta as markdownEditor } from "./markdown-editor/meta";
import { meta as slaUptime } from "./sla-uptime/meta";
import { meta as jsonYaml } from "./json-yaml/meta";
import { meta as jwtDecode } from "./jwt-decode/meta";
import { meta as jwtGenerate } from "./jwt-generate/meta";
import { meta as listCompare } from "./list-compare/meta";
import { meta as markdownHtml } from "./markdown-html/meta";
import { meta as minifyTool } from "./minify/meta";
import { meta as sqlFormat } from "./sql-format/meta";
import { meta as slugify } from "./slugify/meta";
import { meta as textDiff } from "./text-diff/meta";
import { meta as textLines } from "./text-lines/meta";
import { meta as textStats } from "./text-stats/meta";
import { meta as unicodeEscape } from "./unicode-escape/meta";
import { meta as urlEncode } from "./url-encode/meta";
import { meta as urlParse } from "./url-parse/meta";
import { meta as xmlFormat } from "./xml-format/meta";

/**
 * Every tool on the site, in one list.
 *
 * Adding a tool is a folder under `src/tools/` and one line here; the home
 * page, the search box, the command palette, the sitemap, the per-page
 * metadata and the "related tools" links are all derived from this array.
 * Nothing else enumerates tools.
 */
export const TOOLS: ToolMeta[] = [
  base64Text,
  urlEncode,
  urlParse,
  htmlEntity,
  unicodeEscape,
  hexText,
  binaryText,
  gzip,
  hashText,
  hmac,
  bcrypt,
  aes,
  jwtDecode,
  jwtGenerate,
  formatCode,
  sqlFormat,
  xmlFormat,
  minifyTool,
  jsonYaml,
  jsonToml,
  jsonXml,
  jsonCsv,
  jsonToTypes,
  markdownHtml,
  htmlJsx,
  curlFetch,
  dockerRunCompose,
  envJson,
  caseConvert,
  slugify,
  textLines,
  textStats,
  textDiff,
  jsonDiff,
  listCompare,
  regexTest,
  jsonPath,
  validateTool,
  jsonSchemaValidate,
  timestamp,
  cron,
  duration,
  timezone,
  numberBase,
  bitwise,
  ieee754,
  byteSize,
  chmod,
  semver,
  uuid,
  password,
  mockJson,
  rsaKey,
  totp,
  cidr,
  ipConvert,
  userAgent,
  dnsLookup,
  rdap,
  ipGeo,
  httpStatus,
  mimeType,
  imageConvert,
  imageBase64,
  svgOptimize,
  qrGenerate,
  qrRead,
  exif,
  gitCommands,
  regexCheatsheet,
  sqlJoin,
  dockerCli,
  httpHeaders,
  asciiTable,
  slaUptime,
  llmToken,
  jsonViewer,
  markdownEditor,
];

export const TOOL_BY_ID: Map<string, ToolMeta> = new Map(
  TOOLS.map((tool) => [tool.id, tool]),
);

export function getTool(id: string): ToolMeta | undefined {
  return TOOL_BY_ID.get(id);
}

export function toolsInCategory(category: CategoryId): ToolMeta[] {
  return TOOLS.filter((tool) => tool.category === category);
}

/** Categories that actually have tools, in the order `categories.ts` declares. */
export function populatedCategories() {
  return CATEGORIES.map((category) => ({
    category,
    tools: toolsInCategory(category.id),
  })).filter((group) => group.tools.length > 0);
}

/** Resolves `related` slugs, dropping any that has not been built yet. */
export function relatedTools(tool: ToolMeta): ToolMeta[] {
  return (tool.related ?? [])
    .map((id) => TOOL_BY_ID.get(id))
    .filter((value): value is ToolMeta => value !== undefined);
}

/**
 * Ranks tools against what was typed.
 *
 * Both languages' names and keywords are searched whichever locale is active:
 * the words people reach for here are English half the time even in Turkish
 * ("hash", "encode"), and a search that finds nothing because the interface is
 * in the other language is the fastest way to lose someone.
 */
export function searchTools(query: string, locale: Locale): ToolMeta[] {
  const needle = normalize(query);
  if (!needle) return TOOLS;

  return TOOLS.map((tool) => ({ tool, score: score(tool, needle, locale) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.id.localeCompare(b.tool.id))
    .map((entry) => entry.tool);
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
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

function score(tool: ToolMeta, needle: string, locale: Locale): number {
  const primary = normalize(tool.name[locale]);
  const secondary = normalize(tool.name[locale === "tr" ? "en" : "tr"]);
  const keywords = [...tool.keywords.tr, ...tool.keywords.en].map(normalize);

  if (primary === needle) return 100;
  if (primary.startsWith(needle)) return 80;
  if (keywords.some((word) => word === needle)) return 70;
  if (primary.includes(needle)) return 50;
  if (secondary.includes(needle)) return 40;
  if (keywords.some((word) => word.includes(needle))) return 30;
  if (normalize(tool.blurb[locale]).includes(needle)) return 10;
  return 0;
}
