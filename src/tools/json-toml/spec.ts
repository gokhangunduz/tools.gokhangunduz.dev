import type { TextToolSpec } from "../text-tool";
import { jsonToToml, tomlToJson } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "json-to-toml",
      label: { tr: "JSON → TOML", en: "JSON → TOML" },
      sample:
        '{\n  "title": "tools",\n  "server": { "port": 8080, "hosts": ["a.dev"] }\n}',
      run: (input) => jsonToToml(input),
    },
    {
      id: "toml-to-json",
      label: { tr: "TOML → JSON", en: "TOML → JSON" },
      sample: 'title = "tools"\n\n[server]\nport = 8080\nhosts = ["a.dev"]',
      run: (input, options) => tomlToJson(input, Number(options.indent)),
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
  outputExtension: "toml",
};
