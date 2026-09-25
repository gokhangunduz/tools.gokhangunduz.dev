import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "binary-text",
  category: "encode",
  icon: "binary",
  name: { tr: "İkili ↔ metin", en: "Binary ↔ text" },
  blurb: {
    tr: "Metni UTF-8 baytlarının bit gösterimine çevirir ve geri okur.",
    en: "Text to the bits of its UTF-8 bytes, and back.",
  },
  keywords: {
    tr: ["ikili", "binary", "bit", "bayt", "0 1", "metin"],
    en: ["binary", "bits", "bytes", "text", "ones and zeros"],
  },
  related: ["hex-text", "number-base"],
};
