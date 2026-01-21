import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "format-code",
  category: "format",
  icon: "fileCode",
  name: { tr: "Kod biçimlendir (Prettier)", en: "Format code (Prettier)" },
  blurb: {
    tr: "JS, TS, JSON, CSS, HTML, Markdown, YAML ve GraphQL — Prettier'ın kendisi, tarayıcıda.",
    en: "JS, TS, JSON, CSS, HTML, Markdown, YAML and GraphQL — Prettier itself, in the browser.",
  },
  keywords: {
    tr: [
      "prettier",
      "biçimlendir",
      "format",
      "güzelleştir",
      "beautify",
      "girinti",
      "kod",
    ],
    en: ["prettier", "format", "beautify", "pretty print", "indent", "code"],
  },
  related: ["minify", "sql-format", "xml-format"],
};
