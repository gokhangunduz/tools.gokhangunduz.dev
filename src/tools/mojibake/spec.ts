import type { TextToolSpec } from "../text-tool";
import {
  LEGACY_ENCODINGS,
  looksMangled,
  repair,
  type LegacyEncoding,
} from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "repair",
      label: { tr: "Onar", en: "Repair" },
      sample:
        "\u00c5\u017ei\u00c5\u0178e\u00c5\u0178 \u00c3\u2021a\u00c4\u0178r\u00c4\u00b1 \u00e2\u20ac\u201c \u00c3\u00bcr\u00c3\u00bcn a\u00c3\u00a7\u00c4\u00b1klamas\u00c4\u00b1",
      placeholder: {
        tr: "Bozuk g\u00f6r\u00fcnen metni yap\u0131\u015ft\u0131r",
        en: "Paste the text that looks broken",
      },
      run: (input, options) =>
        repair(input, options.encoding as LegacyEncoding),
      footnote: (input) =>
        looksMangled(input)
          ? {
              tr: "Bu metin klasik UTF-8 \u2192 Windows-1252 bozulmas\u0131na benziyor.",
              en: "This looks like the classic UTF-8 read as Windows-1252.",
            }
          : null,
    },
  ],
  options: [
    {
      kind: "select",
      id: "encoding",
      label: { tr: "Yanl\u0131\u015f okunan kodlama", en: "Decoded as" },
      default: "windows-1252",
      choices: LEGACY_ENCODINGS.map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
  ],
};
