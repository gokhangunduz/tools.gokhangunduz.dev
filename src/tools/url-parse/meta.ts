import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "url-parse",
  category: "encode",
  icon: "link",
  name: { tr: "URL parser", en: "URL parser" },
  blurb: {
    tr: "URL'i parçalarına ayırır ve query parametrelerini decode edilmiş halde listeler.",
    en: "Breaks a URL into its parts and lists the query parameters decoded.",
  },
  keywords: {
    tr: ["url", "ayrıştır", "parse", "query", "parametre", "sorgu", "host"],
    en: ["url", "parse", "query", "parameters", "host", "path", "fragment"],
  },
};
