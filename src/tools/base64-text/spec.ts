import type { TextToolSpec } from "../text-tool";
import {
  decodeBase64,
  encodeBase64,
  hasDataUrlPrefix,
  sizeHeadline,
} from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "encode",
      label: { tr: "Encode", en: "Encode" },
      sample: "Merhaba dünya 👋",
      placeholder: { tr: "Encode edilecek metin", en: "Text to encode" },
      run: (input, options) =>
        encodeBase64(input, {
          urlSafe: Boolean(options.urlSafe),
          wrap: Boolean(options.wrap),
        }),
      outputWrap: (options) => (options.wrap ? "off" : "anywhere"),
      headline: (output, input) => {
        const text = sizeHeadline("encode", input, output);
        return text && { text, tone: "muted" };
      },
    },
    {
      id: "decode",
      label: { tr: "Decode", en: "Decode" },
      sample: "TWVyaGFiYSBkw7xueWEg8J+Riw==",
      placeholder: {
        tr: "Decode edilecek Base64 ya da data: URL",
        en: "Base64 or a data: URL to decode",
      },
      run: (input) => decodeBase64(input),
      headline: (output, input) => {
        const text = sizeHeadline("decode", input, output);
        return text && { text, tone: "muted" };
      },
      footnote: (input) =>
        hasDataUrlPrefix(input)
          ? {
              tr: "data: öneki atlandı · Standart ve URL-safe alfabe otomatik tanınır",
              en: "data: prefix skipped · Standard and URL-safe alphabets are detected automatically",
            }
          : {
              tr: "Standart ve URL-safe alfabe otomatik tanınır",
              en: "Standard and URL-safe alphabets are detected automatically",
            },
    },
  ],
  options: [
    {
      kind: "switch",
      id: "urlSafe",
      label: { tr: "URL-safe alfabe", en: "URL-safe alphabet" },
      default: false,
      directions: ["encode"],
    },
    {
      kind: "switch",
      id: "wrap",
      label: { tr: "76 karakterde satır kır", en: "Wrap at 76 characters" },
      default: false,
      directions: ["encode"],
    },
  ],
  inverse: true,
};
