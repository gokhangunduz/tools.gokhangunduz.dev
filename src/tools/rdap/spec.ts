import type { TextToolSpec } from "../text-tool";
import { lookupDomain } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "lookup",
      label: { tr: "Sorgula", en: "Look up" },
      sample: "example.com",
      placeholder: { tr: "example.com", en: "example.com" },
      run: (input, _options, locale) => lookupDomain(input, locale),
    },
  ],
};
