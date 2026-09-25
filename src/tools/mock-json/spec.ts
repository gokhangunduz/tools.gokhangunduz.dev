import type { GeneratorSpec } from "../generator-tool";
import { FIELD_NAMES, generateMock } from "./logic";

export const spec: GeneratorSpec = {
  generate: (options) =>
    generateMock({
      count: Number(options.count),
      fields: String(options.fields),
      indent: Number(options.indent),
    }),
  options: [
    {
      kind: "text",
      id: "fields",
      label: { tr: "Alanlar", en: "Fields" },
      default: "id, name, email, city, active",
      placeholder: { tr: "id, name, email", en: "id, name, email" },
    },
    {
      kind: "select",
      id: "count",
      label: { tr: "Kayıt", en: "Records" },
      default: "10",
      choices: ["5", "10", "25", "100"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
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
  footnote: () => ({
    tr: `Alanlar: ${FIELD_NAMES.join(", ")}`,
    en: `Fields: ${FIELD_NAMES.join(", ")}`,
  }),
};
