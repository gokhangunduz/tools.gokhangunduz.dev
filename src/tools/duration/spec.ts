import type { TextToolSpec } from "../text-tool";
import { describeDuration, type InputUnit } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "convert",
      label: { tr: "Çevir", en: "Convert" },
      sample: "5400000",
      placeholder: { tr: '90000 ya da "1h 30m"', en: '90000 or "1h 30m"' },
      run: (input, options, locale) =>
        describeDuration(input, options.unit as InputUnit, locale),
    },
  ],
  options: [
    {
      kind: "select",
      id: "unit",
      label: { tr: "Sayı girilirse birimi", en: "Unit for a bare number" },
      default: "ms",
      choices: [
        { value: "ms", label: { tr: "ms", en: "ms" } },
        { value: "s", label: { tr: "saniye", en: "seconds" } },
        { value: "m", label: { tr: "dakika", en: "minutes" } },
        { value: "h", label: { tr: "saat", en: "hours" } },
        { value: "d", label: { tr: "gün", en: "days" } },
      ],
    },
  ],
};
