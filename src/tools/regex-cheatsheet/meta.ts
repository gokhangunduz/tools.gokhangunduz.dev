import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "regex-cheatsheet",
  category: "reference",
  icon: "table",
  name: { tr: "RegExp söz dizimi", en: "RegExp syntax" },
  blurb: {
    tr: "Desen yazarken bakılan tablo: gruplar, bakışlar, bayraklar ve Unicode sınıfları.",
    en: "The table you check while writing a pattern: groups, lookarounds, flags and Unicode classes.",
  },
  keywords: {
    tr: ["regex", "regexp", "söz dizimi", "kılavuz", "bakış", "bayrak"],
    en: ["regex", "regexp", "syntax", "cheat sheet", "lookahead", "flags"],
  },
  related: ["regex-test", "git-commands"],
};
