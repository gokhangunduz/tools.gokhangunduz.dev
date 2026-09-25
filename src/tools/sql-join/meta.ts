import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "sql-join",
  category: "reference",
  icon: "table",
  name: { tr: "SQL JOIN türleri", en: "SQL JOIN types" },
  blurb: {
    tr: "Hangi JOIN hangi satırları getirir; LEFT JOIN'i sessizce INNER'a çeviren WHERE tuzağı dahil.",
    en: "Which JOIN returns which rows, including the WHERE that quietly turns a LEFT JOIN into an INNER one.",
  },
  keywords: {
    tr: ["sql", "join", "inner", "left", "outer", "veritabanı", "sorgu"],
    en: ["sql", "join", "inner", "left", "outer", "database", "query"],
  },
  related: ["sql-format", "git-commands"],
};
