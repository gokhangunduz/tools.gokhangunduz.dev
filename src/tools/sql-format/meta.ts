import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "sql-format",
  category: "format",
  icon: "fileCode",
  name: { tr: "SQL biçimlendir", en: "Format SQL" },
  blurb: {
    tr: "Tek satırlık sorguyu okunur hale getirir; lehçeye göre anahtar kelimeleri tanır.",
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
    ],
    en: ["sql", "format", "beautify", "query", "postgres", "mysql", "pretty"],
  },
  related: ["format-code", "xml-format"],
};
