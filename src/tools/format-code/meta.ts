import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "format-code",
  category: "data",
  icon: "code",
  name: { tr: "Format code (Prettier)", en: "Format code (Prettier)" },
  blurb: {
    tr: "JS, TS, JSON, CSS, HTML, Markdown, YAML ve GraphQL — Prettier'ın kendisi, tarayıcıda.",
    en: "JS, TS, JSON, CSS, HTML, Markdown, YAML and GraphQL — Prettier itself, in the browser.",
  },
  keywords: {
    tr: [
      "prettier",
      "biçimlendir",
      "formatter",
      "format",
      "güzelleştir",
      "beautify",
      "girinti",
      "kod",
      "json",
    ],
    en: [
      "prettier",
      "format",
      "beautify",
      "pretty print",
      "indent",
      "code",
      "json",
    ],
  },
};
