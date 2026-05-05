import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "char-inspect",
  category: "text",
  icon: "type",
  name: { tr: "Karakter incele", en: "Inspect characters" },
  blurb: {
    tr: "Her karakterin kod noktas\u0131, UTF-8 baytlar\u0131 ve ad\u0131; g\u00f6r\u00fcnmez ve benzer harfleri i\u015faretler.",
    en: "Every character's code point, UTF-8 bytes and name, with invisibles and look-alikes flagged.",
  },
  keywords: {
    tr: [
      "karakter",
      "unicode",
      "kod noktas\u0131",
      "incele",
      "g\u00f6r\u00fcnmez",
      "bayt",
    ],
    en: [
      "character",
      "unicode",
      "code point",
      "inspect",
      "invisible",
      "bytes",
      "homoglyph",
    ],
  },
  related: ["invisible-chars", "unicode-escape"],
};
