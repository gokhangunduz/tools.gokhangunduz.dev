import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "gzip",
  category: "encode",
  icon: "binary",
  name: { tr: "Gzip sıkıştır / aç", en: "Gzip compress / decompress" },
  blurb: {
    tr: "Metni gzip ya da deflate ile sıkıştırıp Base64 olarak verir; kazancı da yazar.",
    en: "Compresses text with gzip or deflate, printed as Base64, and reports the saving.",
  },
  keywords: {
    tr: ["gzip", "deflate", "sıkıştır", "aç", "zlib", "compress", "base64"],
    en: ["gzip", "deflate", "compress", "decompress", "zlib", "inflate"],
  },
  related: ["base64-text"],
};
