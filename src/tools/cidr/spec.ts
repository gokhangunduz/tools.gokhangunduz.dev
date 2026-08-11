import type { TextToolSpec } from "../text-tool";
import { describeCidr, hostNote } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "describe",
      label: { tr: "Hesapla", en: "Calculate" },
      sample: "10.20.30.40/22",
      placeholder: {
        tr: "192.168.1.0/24 ya da 192.168.1.0 255.255.255.0",
        en: "192.168.1.0/24 or 192.168.1.0 255.255.255.0",
      },
      run: (input, _options, locale) => describeCidr(input, locale),
      footnote: (input) => hostNote(input),
    },
  ],
  input: "line",
};
