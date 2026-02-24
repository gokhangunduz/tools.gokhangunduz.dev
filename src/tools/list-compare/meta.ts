import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "list-compare",
  category: "text",
  icon: "type",
  name: { tr: "Liste karşılaştır", en: "Compare lists" },
  blurb: {
    tr: "İki listenin kesişimini ya da farkını çıkarır; tekrarları temizler, Türkçe harfleri doğru eşler.",
    en: "The intersection or the difference of two lists, deduplicated, with Turkish casing.",
  },
  keywords: {
    tr: [
      "liste",
      "karşılaştır",
      "kesişim",
      "fark",
      "küme",
      "eşleştir",
      "vlookup",
    ],
    en: [
      "list",
      "compare",
      "intersection",
      "difference",
      "set",
      "match",
      "vlookup",
    ],
  },
  related: ["text-diff", "text-lines"],
};
