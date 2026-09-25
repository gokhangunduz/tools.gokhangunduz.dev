import type { TextToolSpec } from "../text-tool";
import { validate, type Language } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "validate",
      label: { tr: "Doğrula", en: "Validate" },
      sample: '{\n  "name": "tools",\n  "port": 8080\n}',
      placeholder: { tr: "Dosya içeriğini yapıştır", en: "Paste the file" },
      run: (input, options, locale) =>
        validate(input, options.language as Language, locale),
    },
  ],
  options: [
    {
      kind: "select",
      id: "language",
      label: { tr: "Biçim", en: "Format" },
      default: "json",
      choices: (["json", "yaml", "toml", "xml", "csv"] as const).map(
        (value) => ({
          value,
          label: { tr: value.toUpperCase(), en: value.toUpperCase() },
        }),
      ),
    },
  ],
};
