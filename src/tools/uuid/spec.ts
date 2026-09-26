import type { GeneratorSpec } from "../generator-tool";
import type { OptionValues } from "../text-tool";
import {
  footnoteFor,
  formatIds,
  generateIds,
  type Kind,
  type ListFormat,
} from "./logic";

const dashed = (values: OptionValues) =>
  values.kind === "v4" || values.kind === "v7";

export const spec: GeneratorSpec = {
  generate: (options) => {
    const items = generateIds(
      options.kind as Kind,
      Number(String(options.count).trim() || NaN),
      { upper: options.upper === true, dashes: options.dashes !== true },
    );
    return { items, text: formatIds(items, options.format as ListFormat) };
  },
  options: [
    {
      kind: "select",
      id: "kind",
      label: { tr: "Biçim", en: "Format" },
      default: "v4",
      choices: [
        {
          value: "v4",
          label: { tr: "UUID v4 (rastgele)", en: "UUID v4 (random)" },
        },
        {
          value: "v7",
          label: { tr: "UUID v7 (zamana göre)", en: "UUID v7 (time-ordered)" },
        },
        {
          value: "ulid",
          label: {
            tr: "ULID (zamana göre, 26 karakter)",
            en: "ULID (time-ordered, 26 characters)",
          },
        },
        {
          value: "nanoid",
          label: {
            tr: "Nano ID (kısa, URL-safe)",
            en: "Nano ID (short, URL-safe)",
          },
        },
      ],
    },
    {
      kind: "text",
      id: "count",
      label: { tr: "Adet", en: "Count" },
      default: "1",
      width: "sm",
      hint: { tr: "1 ile 1000 arası", en: "Between 1 and 1000" },
    },
    {
      kind: "select",
      id: "format",
      label: { tr: "Çıktı biçimi", en: "Output format" },
      default: "lines",
      choices: [
        { value: "lines", label: { tr: "Satır satır", en: "One per line" } },
        { value: "json", label: { tr: "JSON dizisi", en: "JSON array" } },
        { value: "comma", label: { tr: "Virgülle", en: "Comma-separated" } },
        { value: "sql", label: { tr: "SQL IN", en: "SQL IN" } },
      ],
    },
    {
      kind: "switch",
      id: "dashes",
      label: { tr: "Tire yok", en: "No dashes" },
      default: false,
      visibleWhen: dashed,
    },
    {
      kind: "switch",
      id: "upper",
      label: { tr: "Büyük harf", en: "Uppercase" },
      default: false,
      visibleWhen: dashed,
    },
  ],
  footnote: (output, values) => footnoteFor(values.kind as Kind, output),
};
