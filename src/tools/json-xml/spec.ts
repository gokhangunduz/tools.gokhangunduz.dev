import type { TextToolSpec } from "../text-tool";
import { jsonToXml, xmlToJson } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "xml-to-json",
      label: { tr: "XML → JSON", en: "XML → JSON" },
      sample:
        '<order id="1001"><customer>Gökhan</customer><items><item sku="A-1">Klavye</item></items></order>',
      run: (input, options) => xmlToJson(input, Number(options.indent)),
      footnote: () => ({
        tr: "Öznitelikler @_ önekiyle, metin #text anahtarıyla gelir.",
        en: "Attributes come through prefixed with @_, text under #text.",
      }),
    },
    {
      id: "json-to-xml",
      label: { tr: "JSON → XML", en: "JSON → XML" },
      sample:
        '{\n  "order": {\n    "@_id": "1001",\n    "customer": "Gökhan",\n    "items": { "item": { "@_sku": "A-1", "#text": "Klavye" } }\n  }\n}',
      run: (input) => jsonToXml(input),
    },
  ],
  options: [
    {
      kind: "select",
      id: "indent",
      label: { tr: "Girinti", en: "Indent" },
      default: "2",
      choices: ["0", "2", "4"].map((value) => ({
        value,
        label: {
          tr: value === "0" ? "tek satır" : value,
          en: value === "0" ? "one line" : value,
        },
      })),
    },
  ],
  outputExtension: "xml",
};
