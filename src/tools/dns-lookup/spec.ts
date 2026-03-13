import type { TextToolSpec } from "../text-tool";
import { lookup, RECORD_TYPES, type RecordType } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "lookup",
      label: { tr: "Sorgula", en: "Look up" },
      sample: "gokhangunduz.dev",
      placeholder: { tr: "example.com", en: "example.com" },
      run: (input, options, locale) =>
        lookup(input, options.type as RecordType, locale),
    },
  ],
  options: [
    {
      kind: "select",
      id: "type",
      label: { tr: "Kayıt", en: "Record" },
      default: "A",
      choices: RECORD_TYPES.map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
  ],
};
