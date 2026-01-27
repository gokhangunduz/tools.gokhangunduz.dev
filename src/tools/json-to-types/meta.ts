import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-to-types",
  category: "convert",
  icon: "shuffle",
  name: { tr: "JSON'dan tip üret", en: "JSON to types" },
  blurb: {
    tr: "Örnek JSON'dan TypeScript arayüzü, Zod şeması, Go struct'ı ya da JSON Schema çıkarır.",
    en: "Turns a JSON sample into a TypeScript interface, a Zod schema, a Go struct or JSON Schema.",
  },
  keywords: {
    tr: [
      "json",
      "typescript",
      "interface",
      "tip",
      "zod",
      "go",
      "struct",
      "schema",
      "üret",
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
  related: ["json-yaml", "format-code"],
};
