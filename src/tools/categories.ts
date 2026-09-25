import type { Category, CategoryId } from "./types";

/** Display order on the home page, chosen by how often each group is reached for. */
export const CATEGORIES: Category[] = [
  {
    id: "encode",
    name: { tr: "Kodlama", en: "Encoding" },
    icon: "binary",
  },
  {
    id: "crypto",
    name: { tr: "Hash & Kripto", en: "Hash & crypto" },
    icon: "fingerprint",
  },
  {
    id: "jwt",
    name: { tr: "JWT", en: "JWT" },
    icon: "keyRound",
  },
  {
    id: "format",
    name: { tr: "Biçimlendirme", en: "Formatting" },
    icon: "fileCode",
  },
  {
    id: "convert",
    name: { tr: "Dönüştürme", en: "Conversion" },
    icon: "shuffle",
  },
  {
    id: "text",
    name: { tr: "Metin", en: "Text" },
    icon: "type",
  },
  {
    id: "validate",
    name: { tr: "Test & Doğrulama", en: "Testing & validation" },
    icon: "squareCheck",
  },
  {
    id: "time",
    name: { tr: "Zaman", en: "Time" },
    icon: "calendarClock",
  },
  {
    id: "number",
    name: { tr: "Sayı", en: "Numbers" },
    icon: "hash",
  },
  {
    id: "network",
    name: { tr: "Ağ", en: "Network" },
    icon: "network",
  },
  {
    id: "generate",
    name: { tr: "Üretici", en: "Generators" },
    icon: "braces",
  },
  {
    id: "image",
    name: { tr: "Görsel", en: "Images" },
    icon: "image",
  },
  {
    id: "reference",
    name: { tr: "Başvuru", en: "Reference" },
    icon: "table",
  },
  {
    id: "playground",
    name: { tr: "Deneme alanı", en: "Playground" },
    icon: "playCircle",
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;
