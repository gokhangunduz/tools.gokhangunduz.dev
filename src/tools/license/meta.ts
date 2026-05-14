import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "license",
  category: "generate",
  icon: "braces",
  name: { tr: "Lisans se\u00e7 ve \u00fcret", en: "Licence chooser" },
  blurb: {
    tr: "MIT, Apache, BSD, GPL, AGPL \u2014 her birinin ne zorunlu k\u0131ld\u0131\u011f\u0131 tek c\u00fcmlede, metni haz\u0131r.",
    en: "MIT, Apache, BSD, GPL, AGPL \u2014 what each one requires in a sentence, with the text ready.",
  },
  keywords: {
    tr: [
      "lisans",
      "license",
      "mit",
      "apache",
      "gpl",
      "a\u00e7\u0131k kaynak",
      "telif",
    ],
    en: [
      "licence",
      "license",
      "mit",
      "apache",
      "gpl",
      "open source",
      "copyright",
    ],
  },
  related: ["gitignore", "readme-badge"],
};
