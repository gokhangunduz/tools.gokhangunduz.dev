import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "json-viewer",
  category: "data",
  icon: "listTree",
  name: { tr: "JSON tree viewer", en: "JSON tree viewer" },
  blurb: {
    tr: "Büyük JSON'u katlanabilir bir tree olarak gösterir; her satırın JSONPath'ini tek tıkla kopyalarsın.",
    en: "Shows a large JSON as a collapsible tree, with each row's JSONPath one click away.",
  },
  keywords: {
    tr: ["json", "görüntüleyici", "ağaç", "tree", "viewer", "incele", "katla"],
    en: ["json", "viewer", "tree", "inspect", "collapse", "explore"],
  },
};
