import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "http-status",
  category: "reference",
  icon: "table",
  name: { tr: "HTTP durum kodları", en: "HTTP status codes" },
  blurb: {
    tr: "401 mi 403 mü, 302 mi 307 mi — kodun istemci için ne anlama geldiğini yazar.",
    en: "401 or 403, 302 or 307 — what each code means for the client.",
  },
  keywords: {
    tr: ["http", "durum", "status", "kod", "404", "500", "401", "403", "rest"],
    en: ["http", "status", "code", "404", "500", "401", "403", "rest", "api"],
  },
  related: ["mime-type", "curl-fetch"],
};
