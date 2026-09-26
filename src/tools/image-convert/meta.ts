import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "image-convert",
  category: "image",
  icon: "images",
  name: { tr: "Görsel dönüştür ve küçült", en: "Convert and resize images" },
  blurb: {
    tr: "WebP, JPEG ya da PNG'ye çevirir, boyutu sınırlar ve kaç bayt kazandığını yazar.",
    en: "Converts to WebP, JPEG or PNG, caps the size, and reports the bytes saved.",
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
      "resize",
      "sıkıştır",
      "compress",
      "convert",
      "optimize",
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
};
