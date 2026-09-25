import type { TextToolSpec } from "../text-tool";
import { convert, describe, type Ending } from "./logic";

const SAMPLE =
  "birinci sat\u0131r\r\nikinci sat\u0131r\n\u00fc\u00e7\u00fcnc\u00fc sat\u0131r";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "convert",
      label: { tr: "\u00c7evir", en: "Convert" },
      sample: SAMPLE,
      placeholder: {
        tr: "Metni yap\u0131\u015ft\u0131r",
        en: "Paste the text",
      },
      run: (input, options) => convert(input, options.target as Ending),
      footnote: (input, _output, _options) => ({
        tr: describe(input, "tr").split("\n").filter(Boolean).join(" \u00b7 "),
        en: describe(input, "en").split("\n").filter(Boolean).join(" \u00b7 "),
      }),
    },
    {
      id: "count",
      label: { tr: "Say", en: "Count" },
      sample: SAMPLE,
      run: (input, _options, locale) => describe(input, locale),
    },
  ],
  options: [
    {
      kind: "select",
      id: "target",
      label: { tr: "Hedef", en: "Target" },
      default: "lf",
      choices: [
        { value: "lf", label: { tr: "LF (Unix)", en: "LF (Unix)" } },
        {
          value: "crlf",
          label: { tr: "CRLF (Windows)", en: "CRLF (Windows)" },
        },
        { value: "cr", label: { tr: "CR (eski Mac)", en: "CR (classic Mac)" } },
      ],
    },
  ],
};
