import type { TextToolSpec } from "../text-tool";
import { minify, savingLine, type MinifyLanguage } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "minify",
      label: { tr: "Küçült", en: "Minify" },
      sample: `/* Sepet toplamı */
function total(items) {
  return items.reduce(function (sum, item) {
    return sum + item.price * item.qty;
  }, 0);
}`,
      placeholder: { tr: "Kodu yapıştır", en: "Paste code" },
      run: (input, options) =>
        minify(input, options.language as MinifyLanguage),
      footnote: (input, output) => {
        const line = savingLine(input, output);
        return { tr: line, en: line };
      },
    },
  ],
  options: [
    {
      kind: "select",
      id: "language",
      label: { tr: "Dil", en: "Language" },
      default: "javascript",
      choices: [
        { value: "javascript", label: { tr: "JavaScript", en: "JavaScript" } },
        { value: "css", label: { tr: "CSS", en: "CSS" } },
        { value: "json", label: { tr: "JSON", en: "JSON" } },
      ],
    },
  ],
};
