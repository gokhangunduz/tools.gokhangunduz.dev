import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "conventional-commit",
  category: "generate",
  icon: "braces",
  name: { tr: "Commit mesaj\u0131 yaz", en: "Conventional Commit builder" },
  blurb: {
    tr: "T\u00fcr, kapsam, k\u0131r\u0131c\u0131 de\u011fi\u015fiklik ve konu numaras\u0131 \u2014 72 karakter s\u0131n\u0131r\u0131n\u0131 da denetler.",
    en: "Type, scope, breaking change and issue, with the 72-character header limit enforced.",
  },
  keywords: {
    tr: ["commit", "conventional", "git", "mesaj", "changelog", "semver"],
    en: [
      "commit",
      "conventional commits",
      "git",
      "message",
      "changelog",
      "semver",
    ],
  },
  related: ["git-commands", "semver"],
};
