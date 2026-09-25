import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-viewer",
  category: "playground",
  icon: "playCircle",
  name: { tr: "JSON ağacı", en: "JSON tree viewer" },
  blurb: {
    tr: "Büyük JSON'u katlanabilir ağaç olarak gösterir; her satırın JSONPath'ini tek tıkla kopyalarsın.",
    en: "Shows a large JSON as a collapsible tree, with each row's JSONPath one click away.",
  },
  keywords: {
    tr: ["json", "görüntüleyici", "ağaç", "viewer", "incele", "katla"],
    en: ["json", "viewer", "tree", "inspect", "collapse", "explore"],
  },
  related: ["jsonpath", "format-code"],
};
