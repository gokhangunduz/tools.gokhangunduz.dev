import type { TextToolSpec } from "../text-tool";
import { ALGORITHMS, hashAll, hashText, type Algorithm } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "one",
      label: { tr: "Tek algoritma", en: "One algorithm" },
      sample: "Merhaba dünya",
      run: (input, options) =>
        hashText(input, options.algorithm as Algorithm, options.upper === true),
      footnote: (_input, output) => ({
        tr: `${output.length} karakter · ${(output.length * 4) / 8} bayt`,
        en: `${output.length} characters · ${(output.length * 4) / 8} bytes`,
      }),
    },
    {
      id: "all",
      label: { tr: "Hepsi", en: "All of them" },
      sample: "Merhaba dünya",
      run: (input, options) => hashAll(input, options.upper === true),
    },
  ],
  options: [
    {
      kind: "select",
      id: "algorithm",
      label: { tr: "Algoritma", en: "Algorithm" },
      default: "sha256",
      choices: ALGORITHMS.map((name) => ({
        value: name,
        label: { tr: name.toUpperCase(), en: name.toUpperCase() },
      })),
    },
    {
      kind: "switch",
      id: "upper",
      label: { tr: "Büyük harf", en: "Uppercase" },
      default: false,
    },
  ],
};
