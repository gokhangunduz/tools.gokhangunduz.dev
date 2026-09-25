import type { TextToolSpec } from "../text-tool";
import { compress, decompress, ratioLine, type Format } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "compress",
      label: { tr: "Sıkıştır", en: "Compress" },
      sample:
        "Bu metin yeterince tekrar içeriyor ki sıkıştırma kazancı görünsün. ".repeat(
          6,
        ),
      run: (input, options) => compress(input, options.format as Format),
      footnote: (input, output) => {
        const line = ratioLine(input, output);
        return { tr: line, en: line };
      },
    },
    {
      id: "decompress",
      label: { tr: "Aç", en: "Decompress" },
      placeholder: {
        tr: "Base64 kodlanmış sıkıştırılmış veri",
        en: "Base64-encoded compressed data",
      },
      run: (input, options) => decompress(input, options.format as Format),
    },
  ],
  options: [
    {
      kind: "select",
      id: "format",
      label: { tr: "Biçim", en: "Format" },
      default: "gzip",
      choices: [
        { value: "gzip", label: { tr: "gzip", en: "gzip" } },
        {
          value: "deflate",
          label: { tr: "deflate (zlib)", en: "deflate (zlib)" },
        },
        {
          value: "deflate-raw",
          label: { tr: "deflate (ham)", en: "deflate (raw)" },
        },
      ],
    },
  ],
};
