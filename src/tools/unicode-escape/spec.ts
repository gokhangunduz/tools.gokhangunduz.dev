import type { EscapeStyle } from "./logic";
import type { TextToolSpec } from "../text-tool";
import { escapeUnicode, unescapeUnicode } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "escape",
      label: { tr: "Kaçışa çevir", en: "Escape" },
      sample: "Şükrü 👋 İstanbul",
      run: (input, options) =>
        escapeUnicode(
          input,
          options.style as EscapeStyle,
          options.ascii === true,
        ),
    },
    {
      id: "unescape",
      label: { tr: "Kaçıştan çöz", en: "Unescape" },
      sample: "\\u015e\\u00fckr\\u00fc \\ud83d\\udc4b",
      run: (input) => unescapeUnicode(input),
    },
  ],
  options: [
    {
      kind: "select",
      id: "style",
      label: { tr: "Biçim", en: "Style" },
      default: "u",
      choices: [
        { value: "u", label: { tr: "\\uXXXX", en: "\\uXXXX" } },
        { value: "codepoint", label: { tr: "\\u{...}", en: "\\u{...}" } },
      ],
    },
    {
      kind: "switch",
      id: "ascii",
      label: { tr: "ASCII'yi de kaçır", en: "Escape ASCII too" },
      default: false,
    },
  ],
};
