import type { TextToolSpec } from "../text-tool";
import { toCompose } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "to-compose",
      label: { tr: "docker run → compose", en: "docker run → compose" },
      sample: `docker run -d --name kasa-db \\
  -p 5432:5432 \\
  -e POSTGRES_PASSWORD=secret \\
  -e POSTGRES_DB=kasa \\
  -v kasa-data:/var/lib/postgresql/data \\
  --restart unless-stopped \\
  postgres:17-alpine`,
      placeholder: {
        tr: "docker run komutunu yapıştır",
        en: "Paste a docker run command",
      },
      run: (input, options) => toCompose(input, options.version === true),
    },
  ],
  options: [
    {
      kind: "switch",
      id: "version",
      label: { tr: "version: alanını ekle", en: "Include the version: field" },
      default: false,
    },
  ],
  outputExtension: "yaml",
};
