import { parseJson } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * A JSONPath query against a document.
 *
 * The alternative is a scratch file and a `node -e`, which is a lot of
 * ceremony for "what is in that array".
 */
export async function query(
  input: string,
  path: string,
  indent: number,
): Promise<string> {
  if (!input.trim()) return "";
  if (!path.trim()) {
    throw new ToolError({
      tr: "Sorgu girilmedi (örn. $.items[*].id).",
      en: "No query given (e.g. $.items[*].id).",
    });
  }

  const document = parseJson(input);
  const { JSONPath } = await import("jsonpath-plus");

  let result: unknown;
  try {
    result = JSONPath({
      path: path.trim(),
      json: document as object,
      wrap: true,
    });
  } catch (cause) {
    throw new ToolError({
      tr: `Sorgu geçersiz: ${cause instanceof Error ? cause.message : ""}`,
      en: `Invalid query: ${cause instanceof Error ? cause.message : ""}`,
    });
  }

  if (Array.isArray(result) && result.length === 0) {
    return "Eşleşme yok. / No match.";
  }

  return JSON.stringify(result, null, indent);
}
