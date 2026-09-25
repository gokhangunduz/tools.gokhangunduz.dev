import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "hex-text",
  category: "encode",
  icon: "binary",
  name: { tr: "Hex ↔ metin", en: "Hex ↔ text" },
  blurb: {
    tr: "Metni UTF-8 baytlarının onaltılık gösterimine çevirir ve geri okur.",
    en: "Text to the hex of its UTF-8 bytes, and back.",
  },
  keywords: {
    tr: ["hex", "onaltılık", "bayt", "byte", "dump", "utf8", "metin"],
    en: ["hex", "hexadecimal", "bytes", "dump", "utf8", "text", "ascii"],
  },
  related: ["binary-text", "base64-text"],
};
