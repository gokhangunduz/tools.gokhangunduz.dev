import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "url-encode",
  category: "encode",
  icon: "percent",
  name: { tr: "URL encode / decode", en: "URL encode / decode" },
  blurb: {
    tr: "Percent-encoding. Query değeri için ayrı, tam URL için ayrı davranır.",
    en: "Percent-encoding, with the right scope for a query value or a whole URL.",
  },
  keywords: {
    tr: [
      "url",
      "encode",
      "decode",
      "kodla",
      "çöz",
      "yüzde",
      "percent",
      "uri",
      "query",
    ],
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
};
