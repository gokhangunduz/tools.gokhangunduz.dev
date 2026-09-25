import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "image-base64",
  category: "image",
  icon: "image",
  name: { tr: "Görseli Base64'e çevir", en: "Image to Base64" },
  blurb: {
    tr: "Data URI üretir — CSS, HTML ya da JSX'e hazır; ne kadar büyüdüğünü de yazar.",
    en: "Produces a data URI ready for CSS, HTML or JSX, and says how much larger it got.",
  },
  keywords: {
    tr: ["görsel", "base64", "data uri", "gömülü", "css", "ikon"],
    en: ["image", "base64", "data uri", "inline", "css", "icon", "embed"],
  },
  related: ["base64-text", "svg-optimize"],
};
