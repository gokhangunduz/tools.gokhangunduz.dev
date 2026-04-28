import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "html-entity",
  category: "encode",
  icon: "binary",
  name: { tr: "HTML entity kodla / çöz", en: "HTML entity encode / decode" },
  blurb: {
    tr: "< & Ç gibi karakterleri entity'ye çevirir; çözerken markup'ı çalıştırmaz.",
    en: "Turns <, & and Ç into entities, and decodes on the text without running the markup.",
  },
  keywords: {
    tr: ["html", "entity", "kaçış", "escape", "özel karakter", "kodla", "çöz"],
    en: ["html", "entity", "escape", "unescape", "special characters", "amp"],
  },
  related: ["unicode-escape", "url-encode"],
};
