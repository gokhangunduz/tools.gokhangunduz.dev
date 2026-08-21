import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-diff",
  category: "data",
  icon: "gitCompare",
  name: { tr: "JSON diff", en: "JSON diff" },
  blurb: {
    tr: "Yapıyı karşılaştırır: key sırası ve formatlama fark sayılmaz, farklar path'leriyle listelenir.",
    en: "Compares structure, so key order and formatting are not changes; differences are listed by path.",
  },
  keywords: {
    tr: ["json", "diff", "karşılaştır", "compare", "fark", "config", "yapı"],
    en: ["json", "diff", "compare", "difference", "config", "structural"],
  },
};
