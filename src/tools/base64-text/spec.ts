import type { TextToolSpec } from "../text-tool";
import { decodeBase64, encodeBase64 } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "encode",
      label: { tr: "Kodla", en: "Encode" },
      sample: "Merhaba dünya 👋",
      placeholder: { tr: "Kodlanacak metin", en: "Text to encode" },
      run: (input, options) =>
        encodeBase64(input, {
          urlSafe: Boolean(options.urlSafe),
          wrap: Boolean(options.wrap),
        }),
    },
    {
      id: "decode",
      label: { tr: "Çöz", en: "Decode" },
      sample: "TWVyaGFiYSBkw7xueWEg8J+Riw==",
      placeholder: { tr: "Çözülecek Base64", en: "Base64 to decode" },
      run: (input) => decodeBase64(input),
    },
  ],
  options: [
    {
      kind: "switch",
      id: "urlSafe",
      label: { tr: "URL-safe alfabe", en: "URL-safe alphabet" },
      default: false,
    },
    {
      kind: "switch",
      id: "wrap",
      label: { tr: "76 karakterde satır kır", en: "Wrap at 76 characters" },
      default: false,
    },
  ],
};
