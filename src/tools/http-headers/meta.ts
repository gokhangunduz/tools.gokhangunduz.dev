import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "http-headers",
  category: "reference",
  icon: "table",
  name: { tr: "HTTP başlıkları", en: "HTTP headers" },
  blurb: {
    tr: "İstek ve cevap başlıkları, ne işe yaradıkları ve hangi yönde gittikleri.",
    en: "Request and response headers, what each does, and which direction it travels.",
  },
  keywords: {
    tr: ["http", "başlık", "header", "cors", "cache", "güvenlik", "cookie"],
    en: ["http", "header", "cors", "cache", "security", "cookie", "csp"],
  },
  related: ["http-status", "mime-type"],
};
