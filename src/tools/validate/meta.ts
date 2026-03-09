import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "validate",
  category: "validate",
  icon: "squareCheck",
  name: { tr: "Dosya doğrula", en: "Validate a file" },
  blurb: {
    tr: "JSON, YAML, TOML, XML ve CSV — geçerli mi, değilse hangi satırda bozuk.",
    en: "JSON, YAML, TOML, XML and CSV — valid or not, and which line is broken.",
  },
  keywords: {
    tr: [
      "doğrula",
      "validate",
      "json",
      "yaml",
      "xml",
      "toml",
      "csv",
      "hata",
      "linter",
    ],
    en: [
      "validate",
      "validator",
      "json",
      "yaml",
      "xml",
      "toml",
      "csv",
      "lint",
      "syntax",
    ],
  },
  related: ["json-schema-validate", "format-code"],
};
