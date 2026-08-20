import type { TextToolSpec } from "../text-tool";
import { csvNote, csvToJson, jsonToCsv, type CsvInfo } from "./logic";

let lastRun: { key: string; info: CsvInfo | null } | null = null;
const runKey = (input: string, options: Record<string, unknown>) =>
  JSON.stringify([input, options.delimiter, options.typed]);

const DELIMITERS = [
  { value: ",", label: { tr: "virgül", en: "comma" } },
  { value: ";", label: { tr: "noktalı virgül", en: "semicolon" } },
  { value: "\t", label: { tr: "tab", en: "tab" } },
];

export const spec: TextToolSpec = {
  directions: [
    {
      id: "csv-to-json",
      label: { tr: "CSV → JSON", en: "CSV → JSON" },
      sample:
        "ad,şehir,yaş,telefon\nGökhan,İstanbul,33,05321234567\nAyşe,İzmir,29,",
      placeholder: {
        tr: "CSV yapıştır; ilk satır başlık olarak okunur",
        en: "Paste CSV; the first row is read as the header",
      },
      run: async (input, options) => {
        const result = await csvToJson(input, {
          delimiter: String(options.delimiter),
          indent: Number(options.indent),
          typed: options.typed !== false,
        });
        lastRun = { key: runKey(input, options), info: result.info };
        return result.text;
      },
      footnote: (input, _output, options) =>
        lastRun?.key === runKey(input, options) && lastRun.info
          ? csvNote(lastRun.info)
          : null,
      outputExtension: "json",
    },
    {
      id: "json-to-csv",
      label: { tr: "JSON → CSV", en: "JSON → CSV" },
      sample:
        '[\n  { "ad": "Gökhan", "şehir": "İstanbul", "yaş": 33 },\n  { "ad": "Ayşe", "şehir": "İzmir", "yaş": 29, "telefon": "05321234567" }\n]',
      placeholder: {
        tr: "JSON yapıştır: nesnelerden oluşan bir dizi",
        en: "Paste JSON: an array of objects",
      },
      run: (input, options) =>
        jsonToCsv(input, {
          delimiter: String(options.separator),
          excel: options.excel === true,
        }),
      outputExtension: "csv",
    },
  ],
  options: [
    {
      kind: "select",
      id: "delimiter",
      label: { tr: "Ayırıcı", en: "Delimiter" },
      default: "",
      choices: [
        { value: "", label: { tr: "otomatik", en: "auto" } },
        ...DELIMITERS,
      ],
      directions: ["csv-to-json"],
    },
    {
      kind: "switch",
      id: "typed",
      label: { tr: "Sayı/boolean tiple", en: "Type numbers/booleans" },
      hint: {
        tr: "Sayılar ve true/false JSON tipine çevrilir; 0 ile başlayan ya da 15 haneden uzun değerler metin kalır.",
        en: "Numbers and true/false become JSON types; values with a leading 0 or more than 15 digits stay strings.",
      },
      default: true,
      directions: ["csv-to-json"],
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
      directions: ["csv-to-json"],
    },
    {
      kind: "select",
      id: "separator",
      label: { tr: "Ayırıcı", en: "Delimiter" },
      default: ",",
      choices: DELIMITERS,
      directions: ["json-to-csv"],
      visibleWhen: (values) => values.excel !== true,
    },
    {
      kind: "switch",
      id: "excel",
      label: { tr: "Excel uyumlu", en: "Excel-compatible" },
      hint: {
        tr: "Başa BOM ekler ve ; kullanır; Türkçe karakterler ve sütunlar Excel'de doğru açılır.",
        en: "Adds a BOM and uses ;, so accents and columns open correctly in Excel.",
      },
      default: false,
      directions: ["json-to-csv"],
    },
  ],
  inverse: true,
};
