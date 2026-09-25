import type { TextToolSpec } from "../text-tool";
import { analyze } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "analyze",
      label: { tr: "Çözümle", en: "Analyze" },
      sample:
        "Bu bir örnek metin. İkinci cümlesi de var 👋\n\nİkinci paragraf burada.",
      placeholder: { tr: "Metni yapıştır", en: "Paste text" },
      run: (input, _options, locale) => analyze(input, locale),
    },
  ],
};
