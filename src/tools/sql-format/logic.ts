import type { Localized } from "@/i18n";
import { ToolError, type TextPosition } from "../text-tool";

// sql-formatter keys its reserved words off the dialect, so generic SQL leaves Postgres' RETURNING lowercase.
export const DIALECTS = [
  "postgresql",
  "mysql",
  "tsql",
  "sqlite",
  "mariadb",
  "bigquery",
  "snowflake",
  "sql",
] as const;

export type Dialect = (typeof DIALECTS)[number];
export type Keywords = "upper" | "lower" | "preserve";

export const DIALECT_LABELS: Record<Dialect, Localized> = {
  postgresql: { tr: "PostgreSQL", en: "PostgreSQL" },
  mysql: { tr: "MySQL", en: "MySQL" },
  tsql: { tr: "SQL Server (T-SQL)", en: "SQL Server (T-SQL)" },
  sqlite: { tr: "SQLite", en: "SQLite" },
  mariadb: { tr: "MariaDB", en: "MariaDB" },
  bigquery: { tr: "BigQuery", en: "BigQuery" },
  snowflake: { tr: "Snowflake", en: "Snowflake" },
  sql: { tr: "Standart SQL", en: "Standard SQL" },
};

export async function formatSql(
  input: string,
  dialect: Dialect,
  keywords: Keywords,
  tabWidth: number,
): Promise<string> {
  if (!input.trim()) return "";

  const { format } = await import("sql-formatter");
  try {
    return format(input, {
      language: dialect,
      keywordCase: keywords,
      tabWidth,
    });
  } catch (cause) {
    throw sqlError(
      input,
      dialect,
      cause instanceof Error ? cause.message : String(cause),
    );
  }
}

export type ParseProblem = { token: string | null; at?: TextPosition };

export function readParseError(message: string): ParseProblem {
  const lexer = /Unexpected "([\s\S]*?)" at line (\d+) column (\d+)/.exec(
    message,
  );
  const parser = /at token: ([\s\S]*?) at line (\d+) column (\d+)/.exec(
    message,
  );
  const match = lexer ?? parser;
  if (!match) return { token: null };
  const raw = (match[1].trim().split(/\s+/)[0] ?? "").replace(
    /(.)[,;)]+$/,
    "$1",
  );
  return {
    token: raw === "«EOF»" || raw === "" ? null : raw.slice(0, 24),
    at: { line: Number(match[2]), column: Number(match[3]) },
  };
}

export function suggestDialect(input: string): Dialect | null {
  if (/`[^`\n]+`/.test(input)) return "mysql";
  if (/\[[A-Za-z_][\w ]*\]|\bselect\s+top\s+\d/i.test(input)) return "tsql";
  if (/\$\d+\b/.test(input)) return "postgresql";
  return null;
}

export function sqlError(
  input: string,
  dialect: Dialect,
  message: string,
): ToolError {
  const { token, at } = readParseError(message);
  const what: Localized = token
    ? { tr: `beklenmeyen "${token}"`, en: `unexpected "${token}"` }
    : { tr: "sorgu yarıda bitiyor", en: "the query ends too early" };
  const suggested = suggestDialect(input);
  const hint =
    suggested && suggested !== dialect
      ? {
          tr: `. Bu sözdizimi ${DIALECT_LABELS[suggested].tr} gibi görünüyor; Dialect'i değiştirmeyi dene`,
          en: `. This looks like ${DIALECT_LABELS[suggested].en} syntax; try switching the dialect`,
        }
      : { tr: "", en: "" };
  return new ToolError(
    {
      tr: `SQL parse edilemedi: ${what.tr}${hint.tr}`,
      en: `Could not parse the SQL: ${what.en}${hint.en}`,
    },
    suggested && hint.tr
      ? {
          at,
          field: "dialect",
          action: {
            label: {
              tr: `${DIALECT_LABELS[suggested].tr} olarak formatla`,
              en: `Format as ${DIALECT_LABELS[suggested].en}`,
            },
            values: { dialect: suggested },
          },
        }
      : { at },
  );
}
