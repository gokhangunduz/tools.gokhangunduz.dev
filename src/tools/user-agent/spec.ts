import type { TextToolSpec } from "../text-tool";
import { parseUserAgent } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "parse",
      label: { tr: "Ayrıştır", en: "Parse" },
      sample:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      placeholder: { tr: "User-Agent başlığı", en: "A User-Agent header" },
      run: (input) => parseUserAgent(input),
    },
  ],
};
