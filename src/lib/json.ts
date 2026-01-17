import { ToolError } from "@/tools/text-tool";

/**
 * One JSON parser for every tool that takes JSON.
 *
 * `JSON.parse`'s own message ("Unexpected token } in JSON at position 42") is
 * the useful part, so it is kept and wrapped rather than replaced with
 * something vaguer in two languages.
 */
export function parseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "";
    throw new ToolError({
      tr: `Geçersiz JSON: ${detail}`,
      en: `Invalid JSON: ${detail}`,
    });
  }
}

/** Rejects a top-level array or scalar where a tool needs an object. */
export function parseJsonObject(input: string): Record<string, unknown> {
  const value = parseJson(input);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ToolError({
      tr: "Girdi bir JSON nesnesi olmalı ({ ... }).",
      en: "The input must be a JSON object ({ ... }).",
    });
  }
  return value as Record<string, unknown>;
}
