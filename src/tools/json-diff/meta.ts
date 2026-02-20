import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-diff",
  category: "text",
  icon: "type",
  name: { tr: "JSON karşılaştır", en: "JSON diff" },
  blurb: {
    tr: "Yapıyı karşılaştırır: anahtar sırası ve biçimlendirme fark sayılmaz, değerler yollarıyla listelenir.",
    en: "Compares structure, so key order and formatting are not changes; differences are listed by path.",
  },
  keywords: {
    tr: ["json", "diff", "karşılaştır", "fark", "config", "yapı"],
    en: ["json", "diff", "compare", "difference", "config", "structural"],
  },
  related: ["text-diff", "json-yaml"],
};
