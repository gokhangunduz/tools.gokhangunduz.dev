import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "sql-format",
  category: "data",
  icon: "database",
  name: { tr: "SQL formatter", en: "Format SQL" },
  blurb: {
    tr: "Tek satırlık sorguyu okunur hale getirir; dialect'e göre keyword'leri tanır.",
    en: "Turns a one-line query into something readable, with dialect-aware keywords.",
  },
  keywords: {
    tr: [
      "sql",
      "biçimlendir",
      "format",
      "sorgu",
      "postgres",
      "mysql",
      "güzelleştir",
      "formatter",
    ],
    en: ["sql", "format", "beautify", "query", "postgres", "mysql", "pretty"],
  },
};
