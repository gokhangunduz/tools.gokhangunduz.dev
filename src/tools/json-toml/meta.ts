import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-toml",
  category: "convert",
  icon: "shuffle",
  name: { tr: "JSON ↔ TOML", en: "JSON ↔ TOML" },
  blurb: {
    tr: "İki yönlü çevirir; TOML'de karşılığı olmayan null'ı sessizce atmaz, anahtarı söyler.",
    en: "Converts both ways, and names the null TOML cannot hold instead of dropping it.",
  },
  keywords: {
    tr: ["json", "toml", "çevir", "config", "cargo", "pyproject"],
    en: ["json", "toml", "convert", "config", "cargo", "pyproject"],
  },
  related: ["json-yaml"],
};
