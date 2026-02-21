import type { DualToolSpec } from "../dual-tool";
import { validateAgainstSchema } from "./logic";

export const spec: DualToolSpec = {
  left: {
    label: { tr: "JSON Schema", en: "JSON Schema" },
    sample:
      '{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "integer", "minimum": 0 },\n    "email": { "type": "string", "format": "email" }\n  },\n  "required": ["name", "age"]\n}',
  },
  right: {
    label: { tr: "Veri", en: "Data" },
    sample: '{\n  "name": "Gökhan",\n  "age": -1,\n  "email": "hatalı"\n}',
  },
  run: (schema, data) => validateAgainstSchema(schema, data),
};
