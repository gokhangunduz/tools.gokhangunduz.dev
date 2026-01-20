import type { TextToolSpec } from "../text-tool";
import { envToJson, jsonToEnv } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "env-to-json",
      label: { tr: ".env → JSON", en: ".env → JSON" },
      sample:
        '# veritabanı\nDATABASE_URL=postgres://user:pass@localhost:5432/kasa\nPORT=8080\nGREETING="merhaba dünya"',
      run: (input, options) => envToJson(input, Number(options.indent)),
    },
    {
      id: "json-to-env",
      label: { tr: "JSON → .env", en: "JSON → .env" },
      sample:
        '{\n  "DATABASE_URL": "postgres://user:pass@localhost:5432/kasa",\n  "PORT": 8080,\n  "GREETING": "merhaba dünya"\n}',
      run: (input) => jsonToEnv(input),
    },
  ],
  options: [
    {
      kind: "select",
      id: "indent",
      label: { tr: "Girinti", en: "Indent" },
      default: "2",
      choices: ["0", "2"].map((value) => ({
        value,
        label: {
          tr: value === "0" ? "tek satır" : value,
          en: value === "0" ? "one line" : value,
        },
      })),
    },
  ],
};
