import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "jsonpath",
  category: "validate",
  icon: "squareCheck",
  name: { tr: "JSONPath sorgula", en: "JSONPath query" },
  blurb: {
    tr: "Büyük bir JSON belgesinden aradığın alanı çeker: $.items[*].id, filtreler, derin arama.",
    en: "Pulls what you need out of a large JSON document: $.items[*].id, filters, deep search.",
  },
  keywords: {
    tr: ["jsonpath", "json", "sorgu", "filtre", "seç", "yol"],
    en: ["jsonpath", "json", "query", "filter", "select", "path"],
  },
  related: ["json-schema-validate", "json-diff"],
};
