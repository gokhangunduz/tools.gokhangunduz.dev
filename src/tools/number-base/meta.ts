import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "number-base",
  category: "number",
  icon: "hash",
  name: { tr: "Taban çevir", en: "Number base converter" },
  blurb: {
    tr: "2, 8, 10, 16 ve 36 arasında çevirir; BigInt kullandığı için 64 bitlik değerler bozulmaz.",
    en: "Converts between base 2, 8, 10, 16 and 36 with BigInt, so 64-bit values stay exact.",
  },
  keywords: {
    tr: ["taban", "hex", "ikili", "sekizli", "onaltılık", "binary", "çevir"],
    en: ["base", "hex", "binary", "octal", "decimal", "radix", "convert"],
  },
  related: ["bitwise", "hex-text"],
};
