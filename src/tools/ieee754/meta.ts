import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "ieee754",
  category: "number",
  icon: "hash",
  name: { tr: "IEEE 754 kayan nokta", en: "IEEE 754 floats" },
  blurb: {
    tr: "0.1'in neden tam 0.1 olmadığını gösterir: işaret, üs, mantis ve saklanan tam değer.",
    en: "Shows why 0.1 is not exactly 0.1: sign, exponent, mantissa and the exact stored value.",
  },
  keywords: {
    tr: [
      "ieee 754",
      "float",
      "double",
      "kayan nokta",
      "hassasiyet",
      "yuvarlama",
      "bit",
    ],
    en: [
      "ieee 754",
      "float",
      "double",
      "floating point",
      "precision",
      "rounding",
      "bits",
    ],
  },
  related: ["number-base", "bitwise"],
};
