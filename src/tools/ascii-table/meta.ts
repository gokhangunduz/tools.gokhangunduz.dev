import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "ascii-table",
  category: "reference",
  icon: "table",
  name: { tr: "ASCII tablosu", en: "ASCII table" },
  blurb: {
    tr: "Yazdırılabilir karakterler ve önemli kontrol kodları — ondalık, hex ve ikili karşılıklarıyla.",
    en: "The printable characters and the control codes that matter, in decimal, hex and binary.",
  },
  keywords: {
    tr: ["ascii", "tablo", "karakter", "hex", "kod", "kontrol"],
    en: ["ascii", "table", "character", "hex", "code", "control"],
  },
  related: ["hex-text", "unicode-escape"],
};
