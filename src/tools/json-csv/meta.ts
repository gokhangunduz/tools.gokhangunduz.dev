import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-csv",
  category: "convert",
  icon: "shuffle",
  name: { tr: "JSON ↔ CSV", en: "JSON ↔ CSV" },
  blurb: {
    tr: "Başlık satırını anahtar olarak kullanır, sayıları sayı yapar; virgül, noktalı virgül ve sekme destekler.",
    en: "Uses the header row as keys and types the values; comma, semicolon or tab.",
  },
  keywords: {
    tr: ["json", "csv", "tsv", "excel", "tablo", "çevir", "dışa aktar"],
    en: ["json", "csv", "tsv", "excel", "table", "convert", "export"],
  },
  related: ["json-yaml"],
};
