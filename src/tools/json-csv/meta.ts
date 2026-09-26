import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-csv",
  category: "data",
  icon: "sheet",
  name: { tr: "JSON ↔ CSV", en: "JSON ↔ CSV" },
  blurb: {
    tr: "Header satırını key olarak kullanır, sayıları sayı yapar; virgül, noktalı virgül ve tab destekler.",
    en: "Uses the header row as keys and types the values; comma, semicolon or tab.",
  },
  keywords: {
    tr: [
      "json",
      "csv",
      "tsv",
      "excel",
      "tablo",
      "çevir",
      "convert",
      "dışa aktar",
      "export",
    ],
    en: ["json", "csv", "tsv", "excel", "table", "convert", "export"],
  },
};
