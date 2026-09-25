import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "markdown-editor",
  category: "playground",
  icon: "playCircle",
  name: { tr: "Markdown editör", en: "Markdown editor" },
  blurb: {
    tr: "Yaz ve yanında anında gör — tablolar, görev listeleri ve kod blokları dahil.",
    en: "Type on the left, see it on the right — tables, task lists and fenced code included.",
  },
  keywords: {
    tr: ["markdown", "editör", "önizleme", "readme", "yaz", "gfm"],
    en: ["markdown", "editor", "preview", "readme", "write", "gfm"],
  },
  related: ["markdown-html", "json-viewer"],
};
