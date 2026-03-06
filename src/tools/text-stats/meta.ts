import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "text-stats",
  category: "text",
  icon: "type",
  name: { tr: "Metin istatistikleri", en: "Text statistics" },
  blurb: {
    tr: "Karakter, kod noktası, UTF-16 birimi ve bayt ayrı ayrı — emoji bir karakter, dört bayt.",
    en: "Characters, code points, UTF-16 units and bytes separately — an emoji is one and four.",
  },
  keywords: {
    tr: [
      "kelime",
      "karakter",
      "sayaç",
      "istatistik",
      "bayt",
      "uzunluk",
      "okuma",
    ],
    en: [
      "word",
      "character",
      "counter",
      "statistics",
      "bytes",
      "length",
      "reading",
    ],
  },
  related: ["text-lines", "case-convert"],
};
