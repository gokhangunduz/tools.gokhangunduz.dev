import type { TextToolSpec } from "../text-tool";
import { format } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "inspect",
      label: { tr: "\u0130ncele", en: "Inspect" },
      sample: "p\u0430ssword\u00a0\u2014\u200b\u015fifre",
      placeholder: {
        tr: "Metni yap\u0131\u015ft\u0131r",
        en: "Paste the text",
      },
      run: (input, _options, locale) => format(input, locale),
    },
  ],
};
