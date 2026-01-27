import type { TextToolSpec } from "../text-tool";
import { convert, type Target } from "./logic";

const SAMPLE = `[
  { "id": 1, "name": "Gökhan", "tags": ["admin"], "profile": { "city": "İstanbul" } },
  { "id": 2, "name": "Ayşe", "tags": [], "profile": { "city": "İzmir" }, "deleted_at": null }
]`;

function direction(id: Target, tr: string, en: string) {
  return {
    id,
    label: { tr, en },
    sample: SAMPLE,
    placeholder: {
      tr: "Örnek JSON yapıştır",
      en: "Paste a JSON sample",
    },
    run: (input: string, options: Record<string, string | boolean>) =>
      convert(input, id, String(options.name)),
  };
}

export const spec: TextToolSpec = {
  directions: [
    direction("typescript", "TypeScript", "TypeScript"),
    direction("zod", "Zod", "Zod"),
    direction("go", "Go", "Go"),
    direction("json-schema", "JSON Schema", "JSON Schema"),
  ],
  options: [
    {
      kind: "text",
      id: "name",
      label: { tr: "Kök tip adı", en: "Root type name" },
      default: "Root",
      placeholder: { tr: "User", en: "User" },
    },
  ],
};
