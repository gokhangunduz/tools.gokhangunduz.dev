import type { TextToolSpec } from "../text-tool";
import { parseUrl } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "parse",
      label: { tr: "Ayrıştır", en: "Parse" },
      sample:
        "https://tools.gokhangunduz.dev/tr/url-parse?q=bir%20iki&utm_source=x#sonuc",
      placeholder: { tr: "URL yapıştır", en: "Paste a URL" },
      run: (input) => parseUrl(input),
    },
  ],
};
