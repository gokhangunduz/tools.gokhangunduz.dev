import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "readme-badge",
  category: "generate",
  icon: "braces",
  name: { tr: "README rozetleri", en: "README badges" },
  blurb: {
    tr: "shields.io rozetlerini depo adresinden \u00fcretir; \u00f6zel rozette ka\u00e7\u0131\u015f kurallar\u0131n\u0131 da uygular.",
    en: "Builds shields.io badges from the repository path, custom-badge escaping included.",
  },
  keywords: {
    tr: ["badge", "rozet", "readme", "shields", "github", "\u00fcret"],
    en: ["badge", "readme", "shields", "github", "generate", "markdown"],
  },
  related: ["license", "markdown-editor"],
};
