import type { TextToolSpec } from "../text-tool";
import { jsonToYaml, yamlToJson } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "json-to-yaml",
      label: { tr: "JSON → YAML", en: "JSON → YAML" },
      sample:
        '{\n  "name": "tools",\n  "port": 8080,\n  "hosts": ["a.dev", "b.dev"],\n  "debug": false\n}',
      run: (input, options) => jsonToYaml(input, Number(options.indent)),
    },
    {
      id: "yaml-to-json",
      label: { tr: "YAML → JSON", en: "YAML → JSON" },
      sample:
        "name: tools\nport: 8080\nhosts:\n  - a.dev\n  - b.dev\ndebug: false",
      run: (input, options) => yamlToJson(input, Number(options.indent)),
      footnote: () => ({
        tr: "Değerler yazıldığı gibi okunur: no boolean'a, 22:30 sayıya çevrilmez.",
        en: "Values are read as written: no stays a string, 22:30 stays a time.",
      }),
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
  outputExtension: "yaml",
};
