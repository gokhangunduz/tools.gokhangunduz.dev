import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-yaml",
  category: "convert",
  icon: "shuffle",
  name: { tr: "JSON ↔ YAML", en: "JSON ↔ YAML" },
  blurb: {
    tr: "İki yönlü çevirir; YAML okurken no/off/22:30 gibi değerleri bozmaz.",
    en: "Converts both ways, reading YAML without turning no, off or 22:30 into something else.",
  },
  keywords: {
    tr: ["json", "yaml", "yml", "çevir", "dönüştür", "config", "kubernetes"],
    en: ["json", "yaml", "yml", "convert", "config", "kubernetes", "compose"],
  },
  related: ["json-toml", "format-code"],
};
