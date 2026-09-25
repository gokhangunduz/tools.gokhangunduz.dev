import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "unicode-escape",
  category: "encode",
  icon: "binary",
  name: { tr: "Unicode kaçış dizileri", en: "Unicode escapes" },
  blurb: {
    tr: "Metni \\uXXXX ya da \\u{...} biçimine çevirir; emojide vekil çiftini doğru yazar.",
    en: "Text to \\uXXXX or \\u{...} and back, with surrogate pairs written correctly.",
  },
  keywords: {
    tr: [
      "unicode",
      "escape",
      "kaçış",
      "javascript",
      "utf16",
      "emoji",
      "codepoint",
    ],
    en: ["unicode", "escape", "unescape", "javascript", "utf16", "codepoint"],
  },
  related: ["html-entity", "hex-text"],
};
