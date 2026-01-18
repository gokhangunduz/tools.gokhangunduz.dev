import type { TextToolSpec } from "../text-tool";
import { toCode } from "./logic";

const SAMPLE = `curl 'https://api.gokhangunduz.dev/v1/orders' \\
  -H 'accept: application/json' \\
  -H 'content-type: application/json' \\
  -H 'authorization: Bearer TOKEN' \\
  --data-raw '{"sku":"A-1","qty":2}' \\
  --compressed`;

export const spec: TextToolSpec = {
  directions: [
    {
      id: "fetch",
      label: { tr: "fetch", en: "fetch" },
      sample: SAMPLE,
      placeholder: { tr: "curl komutunu yapıştır", en: "Paste a curl command" },
      run: (input) => toCode(input, "fetch"),
    },
    {
      id: "axios",
      label: { tr: "axios", en: "axios" },
      sample: SAMPLE,
      placeholder: { tr: "curl komutunu yapıştır", en: "Paste a curl command" },
      run: (input) => toCode(input, "axios"),
    },
  ],
  outputExtension: "ts",
};
