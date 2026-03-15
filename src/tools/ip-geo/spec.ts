import type { TextToolSpec } from "../text-tool";
import { lookupIp } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "lookup",
      label: { tr: "Sorgula", en: "Look up" },
      sample: "8.8.8.8",
      placeholder: {
        tr: "IP adresi — boş bırakırsan kendi adresin",
        en: "An IP address — leave it empty for your own",
      },
      run: (input, _options, locale) => lookupIp(input, locale),
    },
  ],
};
