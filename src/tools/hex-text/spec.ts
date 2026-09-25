import type { TextToolSpec } from "../text-tool";
import { hexToText, textToHex, type HexSeparator } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "encode",
      label: { tr: "Metin → Hex", en: "Text → hex" },
      sample: "Merhaba dünya",
      run: (input, options) =>
        textToHex(
          input,
          options.separator as HexSeparator,
          options.upper === true,
        ),
    },
    {
      id: "decode",
      label: { tr: "Hex → Metin", en: "Hex → text" },
      sample: "4d 65 72 68 61 62 61 20 64 c3 bc 6e 79 61",
      run: (input) => hexToText(input),
    },
  ],
  options: [
    {
      kind: "select",
      id: "separator",
      label: { tr: "Ayırıcı", en: "Separator" },
      default: "space",
      choices: [
        { value: "space", label: { tr: "boşluk", en: "space" } },
        { value: "none", label: { tr: "yok", en: "none" } },
        { value: "0x", label: { tr: "0x41, 0x42", en: "0x41, 0x42" } },
        { value: "backslash", label: { tr: "\\x41\\x42", en: "\\x41\\x42" } },
      ],
    },
    {
      kind: "switch",
      id: "upper",
      label: { tr: "Büyük harf", en: "Uppercase" },
      default: false,
    },
  ],
};
