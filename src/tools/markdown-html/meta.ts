import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "markdown-html",
  category: "convert",
  icon: "shuffle",
  name: { tr: "Markdown → HTML", en: "Markdown → HTML" },
  blurb: {
    tr: "GitHub lehçesiyle işler: tablolar, görev listeleri, kod blokları.",
    en: "Renders the GitHub dialect: tables, task lists and fenced code.",
  },
  keywords: {
    tr: ["markdown", "md", "html", "readme", "gfm", "çevir"],
    en: ["markdown", "md", "html", "readme", "gfm", "convert"],
  },
  related: ["html-jsx", "format-code"],
};
