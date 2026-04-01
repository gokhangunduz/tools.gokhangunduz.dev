import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "image-convert",
  category: "image",
  icon: "image",
  name: { tr: "Görsel dönüştür ve küçült", en: "Convert and resize images" },
  blurb: {
    tr: "WebP, AVIF, JPEG ya da PNG'ye çevirir, genişliği sınırlar ve kaç bayt kazandığını yazar.",
    en: "Converts to WebP, AVIF, JPEG or PNG, caps the width, and reports the bytes saved.",
  },
  keywords: {
    tr: [
      "görsel",
      "dönüştür",
      "webp",
      "avif",
      "jpeg",
      "png",
      "küçült",
      "sıkıştır",
      "boyut",
    ],
    en: [
      "image",
      "convert",
      "webp",
      "avif",
      "jpeg",
      "png",
      "resize",
      "compress",
      "optimize",
    ],
  },
  related: ["image-base64", "svg-optimize"],
};
