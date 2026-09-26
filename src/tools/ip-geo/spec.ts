import type { TextToolSpec } from "../text-tool";
import { disclaimer, lookupIp, placeOf } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "lookup",
      label: { tr: "Sorgula", en: "Look up" },
      sample: "8.8.8.8",
      placeholder: {
        tr: "IPv4 ya da IPv6 adresi; boş bırakırsan kendi adresin",
        en: "An IPv4 or IPv6 address; leave it empty for your own",
      },
      run: (input, _options, locale) => lookupIp(input, locale),
      headline: (output) => {
        const place = placeOf(output);
        return place ? { text: { tr: place, en: place } } : null;
      },
      footnote: (_input, output) => disclaimer(output),
    },
  ],
  input: "line",
  trigger: "submit",
  runOnEmpty: true,
};
