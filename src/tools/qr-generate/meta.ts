import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "qr-generate",
  category: "image",
  icon: "image",
  name: { tr: "QR kod üret", en: "QR code generator" },
  blurb: {
    tr: "SVG olarak üretir, böylece baskıda da ekranda da net kalır; kapasiteyi de gösterir.",
    en: "Produces SVG, so it stays sharp in print and on screen, and shows the capacity.",
  },
  keywords: {
    tr: ["qr", "kare kod", "üret", "svg", "wifi", "vcard", "bağlantı"],
    en: ["qr", "qr code", "generate", "svg", "wifi", "vcard", "link"],
  },
  related: ["qr-read", "svg-optimize"],
};
