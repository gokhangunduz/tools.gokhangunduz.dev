import type { TextToolSpec } from "../text-tool";
import { describe } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "describe",
      label: { tr: "Çözümle", en: "Describe" },
      sample: "1700000000",
      placeholder: {
        tr: "Unix zaman damgası ya da ISO tarih",
        en: "Unix timestamp or an ISO date",
      },
      run: (input, options, locale) =>
        describe(input, locale, String(options.timeZone)),
    },
  ],
  options: [
    {
      kind: "text",
      id: "timeZone",
      label: { tr: "Saat dilimi", en: "Time zone" },
      default: "Europe/Istanbul",
      placeholder: { tr: "Europe/Istanbul", en: "Europe/Istanbul" },
    },
  ],
};
