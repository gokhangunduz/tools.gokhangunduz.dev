import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "env-json",
  category: "convert",
  icon: "shuffle",
  name: { tr: ".env ↔ JSON", en: ".env ↔ JSON" },
  blurb: {
    tr: "dotenv kurallarıyla okur: export, yorumlar, tırnaklı değerler ve kaçış dizileri.",
    en: "Reads with dotenv's rules: export prefixes, comments, quoted values and escapes.",
  },
  keywords: {
    tr: ["env", "dotenv", "json", "ortam", "değişken", "config", "çevir"],
    en: [
      "env",
      "dotenv",
      "json",
      "environment",
      "variables",
      "config",
      "convert",
    ],
  },
  related: ["json-yaml"],
};
