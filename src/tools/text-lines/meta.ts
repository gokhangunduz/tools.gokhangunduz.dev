import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "text-lines",
  category: "text",
  icon: "type",
  name: { tr: "Satır işlemleri", en: "Line tools" },
  blurb: {
    tr: "Sırala, tekilleştir, tekrarları say, karıştır, numaralandır — sıralama Türkçe alfabeye göre.",
    en: "Sort, deduplicate, count, shuffle and number lines, with Turkish collation.",
  },
  keywords: {
    tr: [
      "satır",
      "sırala",
      "tekilleştir",
      "duplicate",
      "karıştır",
      "liste",
      "numara",
    ],
    en: ["lines", "sort", "unique", "deduplicate", "shuffle", "list", "number"],
  },
  related: ["list-compare", "text-stats"],
};
