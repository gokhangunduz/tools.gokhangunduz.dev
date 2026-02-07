import type { TextToolSpec } from "../text-tool";
import { formatXml, minifyXml } from "./logic";

const SAMPLE =
  '<order id="1001"><customer name="Gökhan Gündüz"/><items><item sku="A-1" qty="2">Klavye</item><item sku="B-7" qty="1">Fare</item></items></order>';

export const spec: TextToolSpec = {
  directions: [
    {
      id: "format",
      label: { tr: "Biçimlendir", en: "Format" },
      sample: SAMPLE,
      placeholder: { tr: "XML yapıştır", en: "Paste XML" },
      run: (input) => formatXml(input),
    },
    {
      id: "minify",
      label: { tr: "Küçült", en: "Minify" },
      sample: SAMPLE,
      run: (input) => minifyXml(input),
    },
  ],
  outputExtension: "xml",
};
