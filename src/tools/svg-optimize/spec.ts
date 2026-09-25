import type { TextToolSpec } from "../text-tool";
import { optimizeSvg, savingLine } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "optimize",
      label: { tr: "Optimize et", en: "Optimize" },
      sample: `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Some Editor 26.0 -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <title>üçgen</title>
  <g id="layer1">
    <path d="M 12.000000 2.0000000 L 22.00000 22.000000 L 2.0000000 22.00000 Z" fill="#ff0000"/>
  </g>
</svg>`,
      placeholder: { tr: "SVG kaynağını yapıştır", en: "Paste the SVG source" },
      run: (input, options) =>
        optimizeSvg(input, {
          precision: Number(options.precision),
          removeIds: options.removeIds === true,
          removeDimensions: options.removeDimensions === true,
        }),
      footnote: (input, output) => {
        const line = savingLine(input, output);
        return { tr: line, en: line };
      },
    },
  ],
  options: [
    {
      kind: "select",
      id: "precision",
      label: { tr: "Ondalık", en: "Precision" },
      default: "2",
      choices: ["0", "1", "2", "3"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "switch",
      id: "removeIds",
      label: { tr: "id'leri temizle", en: "Remove ids" },
      default: false,
    },
    {
      kind: "switch",
      id: "removeDimensions",
      label: { tr: "width/height'ı kaldır", en: "Drop width/height" },
      default: false,
    },
  ],
  outputExtension: "svg",
};
