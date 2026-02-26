import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "regex-test",
  category: "validate",
  icon: "squareCheck",
  name: { tr: "RegExp test", en: "RegExp tester" },
  blurb: {
    tr: "Eşleşmeleri konumu ve yakalama gruplarıyla listeler; değiştirme ve bölme de aynı sayfada.",
    en: "Lists matches with their position and capture groups; replace and split are on the same page.",
  },
  keywords: {
    tr: [
      "regex",
      "regexp",
      "düzenli ifade",
      "desen",
      "eşleşme",
      "test",
      "değiştir",
    ],
    en: [
      "regex",
      "regexp",
      "regular expression",
      "pattern",
      "match",
      "test",
      "replace",
    ],
  },
  related: ["text-lines", "jsonpath"],
};
