import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "case-convert",
  category: "text",
  icon: "type",
  name: { tr: "Harf düzeni çevir", en: "Convert case" },
  blurb: {
    tr: "camelCase, snake_case, kebab-case ve diğerleri — İ/ı dönüşümünü doğru yapar.",
    en: "camelCase, snake_case, kebab-case and the rest, with Turkish İ/ı handled correctly.",
  },
  keywords: {
    tr: ["case", "camel", "snake", "kebab", "pascal", "büyük", "küçük", "harf"],
    en: [
      "case",
      "camel",
      "snake",
      "kebab",
      "pascal",
      "upper",
      "lower",
      "title",
    ],
  },
  related: ["slugify", "text-lines"],
};
