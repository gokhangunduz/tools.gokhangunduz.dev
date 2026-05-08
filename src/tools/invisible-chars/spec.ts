import type { TextToolSpec } from "../text-tool";
import { clean, findAll } from "./logic";

const SAMPLE =
  "\ufeff\u201cKopyalanm\u0131\u015f\u201d\u00a0metin \u2014 g\u00f6r\u00fcnmez\u200b karakterlerle\u2026";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "clean",
      label: { tr: "Temizle", en: "Clean" },
      sample: SAMPLE,
      placeholder: {
        tr: "Metni yap\u0131\u015ft\u0131r",
        en: "Paste the text",
      },
      run: (input, options) => clean(input, options.keepPunctuation === true),
      footnote: (input, _output, _options) => ({
        tr: findAll(input, "tr").split("\n").join(" \u00b7 "),
        en: findAll(input, "en").split("\n").join(" \u00b7 "),
      }),
    },
    {
      id: "find",
      label: { tr: "Bul", en: "Find" },
      sample: SAMPLE,
      run: (input, _options, locale) => findAll(input, locale),
    },
  ],
  options: [
    {
      kind: "switch",
      id: "keepPunctuation",
      label: {
        tr: "T\u0131rnak ve tireleri koru",
        en: "Keep quotes and dashes",
      },
      default: false,
    },
  ],
};
