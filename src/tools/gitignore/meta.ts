import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "gitignore",
  category: "generate",
  icon: "braces",
  name: { tr: ".gitignore \u00fcret", en: ".gitignore generator" },
  blurb: {
    tr: "Projedeki y\u0131\u011f\u0131nlar\u0131 se\u00e7, okunur bir dosya \u00e7\u0131ks\u0131n \u2014 tekrar eden desenler bir kez yaz\u0131l\u0131r.",
    en: "Name the stacks in the project and get a readable file, with shared patterns written once.",
  },
  keywords: {
    tr: [
      "gitignore",
      "git",
      "yoksay",
      "\u015fablon",
      "node",
      "python",
      "\u00fcret",
    ],
    en: [
      "gitignore",
      "git",
      "ignore",
      "template",
      "node",
      "python",
      "generate",
    ],
  },
  related: ["license", "git-commands"],
};
