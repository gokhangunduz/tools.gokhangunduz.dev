import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "minify",
  category: "format",
  icon: "fileCode",
  name: { tr: "Küçült (minify)", en: "Minify" },
  blurb: {
    tr: "JavaScript'i terser, CSS'i csso, JSON'u kendi ayrıştırıcısıyla küçültür; kazancı yazar.",
    en: "JavaScript through terser, CSS through csso, JSON through its own parser — with the saving.",
  },
  keywords: {
    tr: ["minify", "küçült", "sıkıştır", "terser", "csso", "uglify", "boyut"],
    en: ["minify", "compress", "terser", "csso", "uglify", "size", "shrink"],
  },
  related: ["format-code", "gzip"],
};
