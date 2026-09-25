import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "slugify",
  category: "text",
  icon: "type",
  name: { tr: "Slug üret", en: "Slugify" },
  blurb: {
    tr: "Başlığı URL'e uygun hale getirir; ı, ş, ğ gibi harfleri silmek yerine karşılığına çevirir.",
    en: "Turns a title into a URL slug, transliterating ı, ş and ğ instead of dropping them.",
  },
  keywords: {
    tr: ["slug", "url", "seo", "başlık", "permalink", "türkçe"],
    en: ["slug", "url", "seo", "title", "permalink", "transliterate"],
  },
  related: ["case-convert", "url-encode"],
};
