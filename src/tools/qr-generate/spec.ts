import type { TextToolSpec } from "../text-tool";
import { CAPACITY, toSvg, type Level } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "generate",
      label: { tr: "Üret", en: "Generate" },
      sample: "https://tools.gokhangunduz.dev",
      placeholder: {
        tr: "URL, metin, WIFI:… ya da mailto:",
        en: "A URL, text, WIFI:… or mailto:",
      },
      run: (input, options) =>
        toSvg(input, options.level as Level, Number(options.margin)),
      footnote: (input, _output, options) => {
        const level = options.level as Level;
        return {
          tr: `${input.length} / ${CAPACITY[level]} karakter · çıktı SVG, istediğin boyutta net kalır`,
          en: `${input.length} of ${CAPACITY[level]} characters · the output is SVG, sharp at any size`,
        };
      },
    },
  ],
  options: [
    {
      kind: "select",
      id: "level",
      label: { tr: "Hata düzeltme", en: "Error correction" },
      default: "M",
      choices: [
        { value: "L", label: { tr: "L (%7)", en: "L (7%)" } },
        { value: "M", label: { tr: "M (%15)", en: "M (15%)" } },
        { value: "Q", label: { tr: "Q (%25)", en: "Q (25%)" } },
        {
          value: "H",
          label: { tr: "H (%30, logo için)", en: "H (30%, for a logo)" },
        },
      ],
    },
    {
      kind: "select",
      id: "margin",
      label: { tr: "Kenar boşluğu", en: "Margin" },
      default: "2",
      choices: ["0", "1", "2", "4"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
  ],
  outputExtension: "svg",
};
