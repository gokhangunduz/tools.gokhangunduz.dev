import type { TextToolSpec } from "../text-tool";
import { jsonToYaml, yamlNote, yamlToJson } from "./logic";

let lastRun: { input: string; documents: number } | null = null;

export const spec: TextToolSpec = {
  directions: [
    {
      id: "json-to-yaml",
      label: { tr: "JSON → YAML", en: "JSON → YAML" },
      sample:
        '{\n  "name": "tools",\n  "port": 8080,\n  "hosts": ["a.dev", "b.dev"],\n  "debug": false\n}',
      placeholder: { tr: "JSON yapıştır", en: "Paste JSON" },
      run: (input, options) => jsonToYaml(input, Number(options.indent)),
      outputExtension: "yaml",
    },
    {
      id: "yaml-to-json",
      label: { tr: "YAML → JSON", en: "YAML → JSON" },
      sample:
        "name: tools\nport: 8080\nhosts:\n  - a.dev\n  - b.dev\ndebug: false",
      placeholder: { tr: "YAML yapıştır", en: "Paste YAML" },
      run: async (input, options) => {
        const result = await yamlToJson(input, Number(options.indent));
        lastRun = { input, documents: result.documents };
        return result.text;
      },
      footnote: (input) =>
        yamlNote(lastRun?.input === input ? lastRun.documents : 1),
      outputExtension: "json",
    },
  ],
  options: [
    {
      kind: "select",
      id: "indent",
      label: { tr: "Girinti", en: "Indent" },
      default: "2",
      choices: ["0", "2", "4"].map((value) => ({
        value,
        label: {
          tr: value === "0" ? "tek satır" : value,
          en: value === "0" ? "one line" : value,
        },
      })),
    },
  ],
  inverse: true,
  code: true,
};
