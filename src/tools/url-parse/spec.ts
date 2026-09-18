import type { TextToolSpec } from "../text-tool";
import { classify, parseUrl } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "parse",
      label: { tr: "Parse", en: "Parse" },
      sample:
        "https://tools.gokhangunduz.dev/tr/url-parse?q=bir%20iki&tag=a&tag=b&utm_source=#sonuc",
      placeholder: {
        tr: "URL, /path?query ya da alan-adi.com/yol yapıştır",
        en: "Paste a URL, a /path?query or a domain.com/path",
      },
      run: (input) => parseUrl(input),
      footnote: (input) => {
        const kind = classify(input);
        if (kind === "schemeless") {
          return {
            tr: "Şema yoktu, https:// varsayıldı",
            en: "No scheme given, https:// assumed",
          };
        }
        if (kind === "relative") {
          return {
            tr: "Göreli URL: yalnız path, query ve fragment",
            en: "Relative URL: path, query and fragment only",
          };
        }
        return null;
      },
    },
  ],
  input: "line",
};
