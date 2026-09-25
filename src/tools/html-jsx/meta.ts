import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "html-jsx",
  category: "convert",
  icon: "shuffle",
  name: { tr: "HTML → JSX", en: "HTML → JSX" },
  blurb: {
    tr: "class/for'u düzeltir, öznitelikleri camelCase yapar, style'ı nesneye çevirir, tekil etiketleri kapatır.",
    en: "Fixes class/for, camelCases attributes, turns style into an object and closes void elements.",
  },
  keywords: {
    tr: ["html", "jsx", "react", "çevir", "className", "style", "bileşen"],
    en: ["html", "jsx", "react", "convert", "classname", "style", "component"],
  },
  related: ["markdown-html", "format-code"],
};
