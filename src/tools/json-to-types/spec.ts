import type { Direction, OptionValues, TextToolSpec } from "../text-tool";
import { convert, typesNote, type Target, type TypesResult } from "./logic";

const SAMPLE = JSON.stringify(
  [
    {
      id: 1,
      name: "Gökhan",
      tags: ["admin"],
      profile: { city: "İstanbul" },
    },
    {
      id: 2,
      name: "Ayşe",
      tags: [],
      profile: { city: "İzmir" },
      deleted_at: null,
    },
  ],
  null,
  2,
);

let lastRun: { key: string; result: TypesResult } | null = null;
const runKey = (input: string, target: Target, options: OptionValues) =>
  JSON.stringify([input, target, options.name]);

function direction(id: Target, label: string): Direction {
  return {
    id,
    label: { tr: label, en: label },
    sample: SAMPLE,
    placeholder: {
      tr: "Örnek JSON yapıştır",
      en: "Paste a JSON sample",
    },
    run: (input, options) => {
      const result = convert(input, id, String(options.name));
      lastRun = { key: runKey(input, id, options), result };
      return result.text;
    },
    footnote: (input, _output, options) =>
      lastRun?.key === runKey(input, id, options)
        ? typesNote(lastRun.result, id)
        : null,
  };
}

export const spec: TextToolSpec = {
  directions: [
    direction("typescript", "TypeScript"),
    direction("zod", "Zod"),
    direction("go", "Go"),
    direction("json-schema", "JSON Schema"),
  ],
  options: [
    {
      kind: "text",
      id: "name",
      label: { tr: "Root tip adı", en: "Root type name" },
      default: "Root",
      placeholder: { tr: "User", en: "User" },
    },
  ],
};
