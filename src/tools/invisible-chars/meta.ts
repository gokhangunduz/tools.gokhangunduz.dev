import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "invisible-chars",
  category: "text",
  icon: "type",
  name: {
    tr: "G\u00f6r\u00fcnmez karakterleri temizle",
    en: "Strip invisible characters",
  },
  blurb: {
    tr: "BOM, s\u0131f\u0131r geni\u015flikli karakterler ve b\u00f6l\u00fcnmez bo\u015fluklar \u2014 kar\u015f\u0131la\u015ft\u0131rmay\u0131 bozan ne varsa.",
    en: "BOMs, zero-width characters and no-break spaces \u2014 whatever is breaking the comparison.",
  },
  keywords: {
    tr: [
      "g\u00f6r\u00fcnmez",
      "bom",
      "s\u0131f\u0131r geni\u015flik",
      "temizle",
      "bo\u015fluk",
      "t\u0131rnak",
      "kopyala",
    ],
    en: [
      "invisible",
      "bom",
      "zero width",
      "clean",
      "whitespace",
      "smart quotes",
      "paste",
    ],
  },
  related: ["char-inspect", "mojibake"],
};
