import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "line-endings",
  category: "text",
  icon: "type",
  name: { tr: "Sat\u0131r sonlar\u0131", en: "Line endings" },
  blurb: {
    tr: "CRLF, LF ve CR'yi sayar ve \u00e7evirir; kar\u0131\u015f\u0131k dosyay\u0131 s\u00f6yler \u2014 diff'in her sat\u0131r\u0131 de\u011fi\u015fmi\u015f g\u00f6stermesinin sebebi.",
    en: "Counts and converts CRLF, LF and CR, and names a mixed file \u2014 why a diff shows every line as changed.",
  },
  keywords: {
    tr: ["sat\u0131r sonu", "crlf", "lf", "windows", "unix", "dosya", "diff"],
    en: [
      "line ending",
      "crlf",
      "lf",
      "eol",
      "windows",
      "unix",
      "newline",
      "diff",
    ],
  },
  related: ["invisible-chars", "text-diff"],
};
