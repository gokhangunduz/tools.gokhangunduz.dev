import type { Category, CategoryId } from "./types";

/** Display order on the home page, chosen by how often each group is reached for. */
export const CATEGORIES: Category[] = [
  {
    id: "data",
    name: { tr: "JSON & veri", en: "JSON & data" },
    icon: "braces",
  },
  {
    id: "encode",
    name: { tr: "Encode & decode", en: "Encode & decode" },
    icon: "binary",
  },
  {
    id: "text",
    name: { tr: "Metin", en: "Text" },
    icon: "type",
  },
  {
    id: "crypto",
    name: { tr: "Güvenlik & ID", en: "Security & IDs" },
    icon: "shieldCheck",
  },
  {
    id: "time",
    name: { tr: "Zaman", en: "Time" },
    icon: "calendarClock",
  },
  {
    id: "network",
    name: { tr: "Ağ", en: "Network" },
    icon: "network",
  },
  {
    id: "image",
    name: { tr: "Görsel", en: "Images" },
    icon: "image",
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;
