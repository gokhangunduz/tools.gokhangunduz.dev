import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "url-encode",
  category: "encode",
  icon: "binary",
  name: { tr: "URL kodla / çöz", en: "URL encode / decode" },
  blurb: {
    tr: "Yüzde kodlaması. Sorgu değeri için ayrı, tam URL için ayrı davranır.",
    en: "Percent-encoding, with the right scope for a query value or a whole URL.",
  },
  keywords: {
    tr: ["url", "encode", "kodla", "çöz", "yüzde", "percent", "uri", "query"],
    en: [
      "url",
      "encode",
      "decode",
      "percent",
      "uri",
      "escape",
      "encodeuricomponent",
    ],
  },
  related: ["url-parse", "base64-text"],
};
