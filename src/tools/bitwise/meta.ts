import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "bitwise",
  category: "number",
  icon: "hash",
  name: { tr: "Bit işlemleri", en: "Bitwise calculator" },
  blurb: {
    tr: "AND, OR, XOR, NOT ve kaydırmalar — sonucu 32 bitlik ikili gösterimde hizalı yazar.",
    en: "AND, OR, XOR, NOT and the shifts, with the operands and result aligned in 32-bit binary.",
  },
  keywords: {
    tr: ["bit", "bitwise", "and", "or", "xor", "kaydırma", "maske", "flag"],
    en: ["bit", "bitwise", "and", "or", "xor", "shift", "mask", "flags"],
  },
  related: ["number-base", "ieee754"],
};
