import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "xml-format",
  category: "format",
  icon: "fileCode",
  name: { tr: "XML biçimlendir / küçült", en: "Format / minify XML" },
  blurb: {
    tr: "Gerçek bir ayrıştırıcıyla girintiler; bozuk XML'i düzeltmeye çalışmaz, satırını söyler.",
    en: "Indents through a real parser, and reports broken XML by line instead of fixing it quietly.",
  },
  keywords: {
    tr: [
      "xml",
      "biçimlendir",
      "format",
      "girinti",
      "küçült",
      "doğrula",
      "soap",
    ],
    en: ["xml", "format", "pretty", "indent", "minify", "validate", "soap"],
  },
  related: ["format-code", "json-xml"],
};
