import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "regex-test",
  category: "text",
  icon: "regex",
  name: { tr: "RegExp tester", en: "RegExp tester" },
  blurb: {
    tr: "Eşleşmeleri konumu ve capture group'larıyla listeler; replace ve split de aynı sayfada.",
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
      "replace",
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
};
