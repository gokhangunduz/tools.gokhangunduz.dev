import type { TextToolSpec } from "../text-tool";
import { report, type Encoding } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "count",
      label: { tr: "Say", en: "Count" },
      sample:
        "Bu metin Türkçe yazıldığı için İngilizce karşılığından daha fazla token tutar; fark faturaya da yansır.",
      placeholder: { tr: "Metni yapıştır", en: "Paste the text" },
      run: (input, options, locale) =>
        report(input, options.encoding as Encoding, locale),
    },
  ],
  options: [
    {
      kind: "select",
      id: "encoding",
      label: { tr: "Kodlama", en: "Encoding" },
      default: "o200k_base",
      choices: [
        {
          value: "o200k_base",
          label: { tr: "o200k (GPT-4o+)", en: "o200k (GPT-4o+)" },
        },
        {
          value: "cl100k_base",
          label: { tr: "cl100k (GPT-4, 3.5)", en: "cl100k (GPT-4, 3.5)" },
        },
      ],
    },
  ],
};
