import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "text-diff",
  category: "text",
  icon: "diff",
  name: { tr: "Metin karşılaştır", en: "Text diff" },
  blurb: {
    tr: "İki metni satır, kelime ya da karakter düzeyinde karşılaştırır; CRLF farkını sorun etmez.",
    en: "Compares two texts by line, word or character, and does not trip over CRLF.",
  },
  keywords: {
    tr: ["diff", "karşılaştır", "fark", "metin", "değişiklik", "patch"],
    en: ["diff", "compare", "difference", "text", "changes", "patch"],
  },
};
