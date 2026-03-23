import type { GeneratorSpec } from "../generator-tool";
import { generateIds, inspect, type Kind } from "./logic";

export const spec: GeneratorSpec = {
  generate: (options) =>
    generateIds(
      options.kind as Kind,
      Number(options.count),
      options.upper === true,
    ),
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
        { value: "ulid", label: { tr: "ULID", en: "ULID" } },
        { value: "nanoid", label: { tr: "Nano ID", en: "Nano ID" } },
      ],
    },
    {
      kind: "select",
      id: "count",
      label: { tr: "Adet", en: "Count" },
      default: "1",
      choices: ["1", "5", "10", "50", "100"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "switch",
      id: "upper",
      label: { tr: "Büyük harf", en: "Uppercase" },
      default: false,
    },
  ],
  footnote: (output) => {
    const described = inspect(output.split("\n")[0]);
    if (described) return { tr: described, en: described };
    return {
      tr: "v7 ve ULID zamana göre sıralanır; veritabanı birincil anahtarı için v4'ten iyidir.",
      en: "v7 and ULID sort by time, which beats v4 as a database primary key.",
    };
  },
};
