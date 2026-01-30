import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-xml",
  category: "convert",
  icon: "shuffle",
  name: { tr: "JSON ↔ XML", en: "JSON ↔ XML" },
  blurb: {
    tr: "Öznitelikleri koruyarak iki yönlü çevirir; bozuk XML'i satırıyla bildirir.",
    en: "Converts both ways with attributes preserved, and reports broken XML by line.",
  },
  keywords: {
    tr: ["json", "xml", "çevir", "soap", "rss", "öznitelik"],
    en: ["json", "xml", "convert", "soap", "rss", "attributes"],
  },
  related: ["xml-format", "json-yaml"],
};
