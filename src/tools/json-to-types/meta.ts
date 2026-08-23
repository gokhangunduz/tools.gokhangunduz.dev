import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-to-types",
  category: "data",
  icon: "fileType",
  name: { tr: "JSON'dan tip üret", en: "JSON to types" },
  blurb: {
    tr: "Örnek JSON'dan TypeScript interface'i, Zod schema'sı, Go struct'ı ya da JSON Schema üretir.",
    en: "Turns a JSON sample into a TypeScript interface, a Zod schema, a Go struct or JSON Schema.",
  },
  keywords: {
    tr: [
      "json",
      "typescript",
      "interface",
      "tip",
      "type",
      "zod",
      "go",
      "struct",
      "schema",
      "üret",
      "generate",
    ],
    en: [
      "json",
      "typescript",
      "interface",
      "type",
      "zod",
      "go",
      "struct",
      "schema",
      "generate",
    ],
  },
};
