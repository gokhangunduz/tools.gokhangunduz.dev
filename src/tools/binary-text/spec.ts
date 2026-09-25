import type { TextToolSpec } from "../text-tool";
import { binaryToText, textToBinary } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "encode",
      label: { tr: "Metin → İkili", en: "Text → binary" },
      sample: "Merhaba",
      run: (input, options) => textToBinary(input, options.spaced !== false),
    },
    {
      id: "decode",
      label: { tr: "İkili → Metin", en: "Binary → text" },
      sample: "01001101 01100101 01110010 01101000 01100001 01100010 01100001",
      run: (input) => binaryToText(input),
    },
  ],
  options: [
    {
      kind: "switch",
      id: "spaced",
      label: { tr: "Baytları boşlukla ayır", en: "Space between bytes" },
      default: true,
    },
  ],
};
