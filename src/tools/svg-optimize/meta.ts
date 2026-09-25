import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "svg-optimize",
  category: "image",
  icon: "image",
  name: { tr: "SVG optimize et", en: "Optimize SVG" },
  blurb: {
    tr: "Editör artıklarını ve gereksiz ondalıkları atar; viewBox'a ve id'lere varsayılan olarak dokunmaz.",
    en: "Strips editor noise and excess decimals, leaving the viewBox and ids alone by default.",
  },
  keywords: {
    tr: ["svg", "optimize", "svgo", "küçült", "ikon", "temizle"],
    en: ["svg", "optimize", "svgo", "minify", "icon", "clean"],
  },
  related: ["image-convert", "minify"],
};
