import type { Locale } from "@/i18n";
import { CATEGORIES } from "./categories";
import type { CategoryId, ToolMeta } from "./types";

import { meta as base64Text } from "./base64-text/meta";

/**
 * Every tool on the site, in one list.
 *
 * Adding a tool is a folder under `src/tools/` and one line here; the home
 * page, the search box, the command palette, the sitemap, the per-page
 * metadata and the "related tools" links are all derived from this array.
 * Nothing else enumerates tools.
 */
export const TOOLS: ToolMeta[] = [base64Text];

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
