import { parseJson } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * JSON and CSV, both directions.
 *
 * CSV is a table, so the JSON side has to be an array of objects — anything
 * else is refused rather than flattened into a shape the user did not ask for.
 * Nested values are written as JSON inside the cell, which is lossy in the
 * sense that it is no longer a table, but it is reversible and it is what
 * every spreadsheet does with them anyway.
 */
export async function jsonToCsv(
  input: string,
  delimiter: string,
): Promise<string> {
  if (!input.trim()) return "";

  const value = parseJson(input);
  if (!Array.isArray(value)) {
    throw new ToolError({
      tr: "CSV bir tablodur: girdi nesnelerden oluşan bir dizi olmalı.",
      en: "CSV is a table: the input must be an array of objects.",
    });
  }
  if (value.length === 0) return "";
  if (
    value.some((row) => !row || typeof row !== "object" || Array.isArray(row))
  ) {
    throw new ToolError({
      tr: "Dizinin her öğesi bir nesne olmalı.",
      en: "Every item in the array must be an object.",
    });
  }

  const rows = value.map((row) =>
    Object.fromEntries(
      Object.entries(row as Record<string, unknown>).map(([key, cell]) => [
        key,
        cell !== null && typeof cell === "object" ? JSON.stringify(cell) : cell,
      ]),
    ),
  );

  const Papa = (await import("papaparse")).default;
  return Papa.unparse(rows, { delimiter, newline: "\n" });
}

export async function csvToJson(
  input: string,
  delimiter: string,
  indent: number,
): Promise<string> {
  if (!input.trim()) return "";

  const Papa = (await import("papaparse")).default;
  const result = Papa.parse<Record<string, unknown>>(input, {
    header: true,
    delimiter: delimiter || undefined,
    skipEmptyLines: true,
    // Numbers and booleans become numbers and booleans, which is what makes
    // the output usable as JSON rather than a table of strings.
    dynamicTyping: true,
  });

  const fatal = result.errors.find((error) => error.type !== "FieldMismatch");
  if (fatal) {
    throw new ToolError({
      tr: `CSV okunamadı (satır ${(fatal.row ?? 0) + 1}): ${fatal.message}`,
      en: `Could not read the CSV (row ${(fatal.row ?? 0) + 1}): ${fatal.message}`,
    });
  }

  return JSON.stringify(result.data, null, indent);
}
