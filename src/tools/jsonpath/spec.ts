import type { TextToolSpec } from "../text-tool";
import { query } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "query",
      label: { tr: "Sorgula", en: "Query" },
      sample:
        '{\n  "store": {\n    "books": [\n      { "title": "Bir", "price": 30 },\n      { "title": "İki", "price": 50 },\n      { "title": "Üç", "price": 120 }\n    ]\n  }\n}',
      placeholder: { tr: "JSON belgesi", en: "A JSON document" },
      run: (input, options) =>
        query(input, String(options.path), Number(options.indent)),
    },
  ],
  options: [
    {
      kind: "text",
      id: "path",
      label: { tr: "Sorgu", en: "Query" },
      default: "$.store.books[*].title",
      placeholder: { tr: "$.items[*].id", en: "$.items[*].id" },
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
  outputExtension: "json",
};
