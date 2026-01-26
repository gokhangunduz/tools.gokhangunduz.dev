import type { TextToolSpec } from "../text-tool";
import { csvToJson, jsonToCsv } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "csv-to-json",
      label: { tr: "CSV → JSON", en: "CSV → JSON" },
      sample: "ad,şehir,yaş\nGökhan,İstanbul,33\nAyşe,İzmir,29",
      run: (input, options) =>
        csvToJson(input, String(options.delimiter), Number(options.indent)),
    },
    {
      id: "json-to-csv",
      label: { tr: "JSON → CSV", en: "JSON → CSV" },
      sample:
        '[\n  { "ad": "Gökhan", "şehir": "İstanbul", "yaş": 33 },\n  { "ad": "Ayşe", "şehir": "İzmir", "yaş": 29 }\n]',
      run: (input, options) => jsonToCsv(input, String(options.delimiter)),
    },
  ],
  options: [
    {
      kind: "select",
      id: "delimiter",
      label: { tr: "Ayırıcı", en: "Delimiter" },
      default: ",",
      choices: [
        { value: ",", label: { tr: "virgül", en: "comma" } },
        { value: ";", label: { tr: "noktalı virgül", en: "semicolon" } },
        { value: "\t", label: { tr: "sekme", en: "tab" } },
      ],
    },
    {
      kind: "select",
      id: "indent",
      label: { tr: "Girinti", en: "Indent" },
      default: "2",
      choices: ["0", "2"].map((value) => ({
        value,
        label: {
          tr: value === "0" ? "tek satır" : value,
          en: value === "0" ? "one line" : value,
        },
      })),
    },
  ],
  outputExtension: "csv",
};
