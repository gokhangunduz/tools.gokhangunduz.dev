import type { Localized } from "@/i18n";
import { parseJson } from "@/lib/json";
import { positionAt, ToolError } from "../text-tool";

/**
 * JSON and CSV, both directions.
 *
 * CSV is a table, so the JSON side has to be an array of objects — anything
 * else is refused rather than flattened into a shape the user did not ask for.
 * Nested values are written as JSON inside the cell, which is lossy in the
 * sense that it is no longer a table, but it is reversible and it is what
 * every spreadsheet does with them anyway.
 */
export type JsonToCsvOptions = { delimiter: string; excel?: boolean };

export async function jsonToCsv(
  input: string,
  { delimiter, excel = false }: JsonToCsvOptions,
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
      tr: "Dizinin her elemanı bir nesne olmalı.",
      en: "Every item in the array must be an object.",
    });
  }

  const columns: string[] = [];
  const seen = new Set<string>();
  const rows = value.map((row) =>
    Object.fromEntries(
      Object.entries(row as Record<string, unknown>).map(([key, cell]) => {
        if (!seen.has(key)) {
          seen.add(key);
          columns.push(key);
        }
        return [
          key,
          cell !== null && typeof cell === "object"
            ? JSON.stringify(cell)
            : cell,
        ];
      }),
    ),
  );

  const Papa = (await import("papaparse")).default;
  const csv = Papa.unparse(rows, {
    columns,
    delimiter: excel ? ";" : delimiter,
    newline: "\n",
  });
  return excel ? `\uFEFF${csv}` : csv;
}

export type CsvInfo = {
  delimiter: string;
  detected: boolean;
  rows: number;
  columns: number;
  mismatched: number[];
  header: string[];
};

export type CsvResult = { text: string; info: CsvInfo | null };

export type CsvToJsonOptions = {
  delimiter: string;
  indent: number;
  typed?: boolean;
};

const QUOTE_ERRORS: Record<string, Localized> = {
  MissingQuotes: { tr: "tırnak kapanmamış", en: "a quote is never closed" },
  InvalidQuotes: {
    tr: "tırnaklı alandan sonra ayırıcı bekleniyordu",
    en: "expected a delimiter after a quoted field",
  },
};

export async function csvToJson(
  input: string,
  { delimiter, indent, typed = true }: CsvToJsonOptions,
): Promise<CsvResult> {
  if (!input.trim()) return { text: "", info: null };

  const Papa = (await import("papaparse")).default;
  const text = input.replace(/^\uFEFF/, "");
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter: delimiter || undefined,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const fatal = result.errors.find((error) => error.type === "Quotes");
  if (fatal) {
    const reason = QUOTE_ERRORS[fatal.code] ?? {
      tr: "tırnak hatası",
      en: "a quoting error",
    };
    throw new ToolError(
      {
        tr: `CSV okunamadı: ${reason.tr}`,
        en: `Could not read the CSV: ${reason.en}`,
      },
      {
        at:
          typeof fatal.index === "number"
            ? positionAt(text, fatal.index)
            : { line: (fatal.row ?? 0) + 2, column: 1 },
      },
    );
  }

  const mismatched = [
    ...new Set(
      result.errors
        .filter((error) => error.type === "FieldMismatch")
        .map((error) => (error.row ?? 0) + 2),
    ),
  ].sort((a, b) => a - b);

  const data = result.data.map((row) => {
    const clean: Record<string, unknown> = {};
    for (const [key, cell] of Object.entries(row)) {
      if (key === "__parsed_extra") continue;
      clean[key] = typed ? typeCell(cell) : (cell ?? "");
    }
    return clean;
  });

  const header = result.meta.fields ?? [];
  return {
    text: JSON.stringify(data, null, indent),
    info: {
      delimiter: result.meta.delimiter,
      detected: !delimiter,
      rows: data.length,
      columns: header.length,
      mismatched,
      header,
    },
  };
}

const NUMBER = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * A cell as the JSON value it looks like. A leading zero (a phone number, a
 * postcode) or more digits than a double holds keeps it a string.
 */
export function typeCell(cell: string | undefined): unknown {
  if (cell === undefined || cell === "") return null;
  if (/^(?:true|TRUE|True)$/.test(cell)) return true;
  if (/^(?:false|FALSE|False)$/.test(cell)) return false;
  if (
    NUMBER.test(cell) &&
    !/^-?0\d/.test(cell) &&
    cell.replace(/\D/g, "").length <= 15
  ) {
    return Number(cell);
  }
  return cell;
}

const DELIMITER_NAMES: Record<string, Localized> = {
  ",": { tr: "virgül", en: "comma" },
  ";": { tr: "noktalı virgül", en: "semicolon" },
  "\t": { tr: "tab", en: "tab" },
  "|": { tr: "dikey çizgi", en: "pipe" },
};

function delimiterName(delimiter: string): Localized {
  return (
    DELIMITER_NAMES[delimiter] ?? {
      tr: `"${delimiter}"`,
      en: `"${delimiter}"`,
    }
  );
}

export function csvNote(info: CsvInfo): Localized {
  const parts: Localized[] = [];
  if (info.detected) {
    const name = delimiterName(info.delimiter);
    parts.push({
      tr: `Ayırıcı: ${name.tr} (otomatik)`,
      en: `Delimiter: ${name.en} (detected)`,
    });
  }
  parts.push({
    tr: `${info.rows} satır · ${info.columns} sütun`,
    en: `${info.rows} ${info.rows === 1 ? "row" : "rows"} · ${info.columns} ${info.columns === 1 ? "column" : "columns"}`,
  });
  if (info.mismatched.length > 0) {
    const lines = info.mismatched.slice(0, 5).join(", ");
    const more = info.mismatched.length > 5 ? "…" : "";
    parts.push({
      tr: `sütun sayısı uymayan satır: ${lines}${more}`,
      en: `column count differs on line ${lines}${more}`,
    });
  }
  if (info.columns === 1) {
    const hinted = [";", "\t", ","].find(
      (candidate) =>
        candidate !== info.delimiter && info.header[0]?.includes(candidate),
    );
    if (hinted) {
      const name = delimiterName(hinted);
      parts.push({
        tr: `başlıkta ${name.tr} var; ayırıcı olarak onu seç`,
        en: `the header contains a ${name.en}; choose it as the delimiter`,
      });
    }
  }
  return {
    tr: parts.map((part) => part.tr).join(" · "),
    en: parts.map((part) => part.en).join(" · "),
  };
}
