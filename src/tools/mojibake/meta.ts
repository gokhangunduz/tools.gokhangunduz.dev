import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "mojibake",
  category: "text",
  icon: "type",
  name: { tr: "Bozuk T\u00fcrk\u00e7e karakterleri onar", en: "Fix mojibake" },
  blurb: {
    tr: "\u00c5\u0178 \u2192 \u015f, \u00c3\u00bc \u2192 \u00fc \u2014 yanl\u0131\u015f kodlamayla okunmu\u015f metni geri \u00e7evirir.",
    en: "Turns \u00c5\u0178 back into \u015f and \u00c3\u00bc back into \u00fc: text decoded with the wrong encoding, undone.",
  },
  keywords: {
    tr: [
      "mojibake",
      "bozuk",
      "karakter",
      "kodlama",
      "utf8",
      "t\u00fcrk\u00e7e",
      "onar",
      "\u00e7\u00f6z",
    ],
    en: [
      "mojibake",
      "broken",
      "characters",
      "encoding",
      "utf8",
      "garbled",
      "repair",
      "fix",
    ],
  },
  related: ["char-inspect", "invisible-chars"],
};
