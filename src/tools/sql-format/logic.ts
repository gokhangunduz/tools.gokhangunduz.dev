import { ToolError } from "../text-tool";

/**
 * SQL formatting, per dialect.
 *
 * The dialect matters more here than it looks: `sql-formatter` keys its
 * reserved words and its function list off it, so running Postgres SQL through
 * the generic dialect leaves `RETURNING` and `ILIKE` uncapitalised and breaks
 * the alignment that is the reason to format at all.
 */
export const DIALECTS = [
  "sql",
  "postgresql",
  "mysql",
  "sqlite",
  "mariadb",
  "bigquery",
  "snowflake",
  "tsql",
] as const;

export type Dialect = (typeof DIALECTS)[number];
export type Keywords = "upper" | "lower" | "preserve";

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
    throw new ToolError({
      tr: `SQL ayrıştırılamadı: ${cause instanceof Error ? cause.message : ""}`,
      en: `Could not parse the SQL: ${cause instanceof Error ? cause.message : ""}`,
    });
  }
}
