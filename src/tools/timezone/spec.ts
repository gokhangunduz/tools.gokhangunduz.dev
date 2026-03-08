import type { TextToolSpec } from "../text-tool";
import { convertZones } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "convert",
      label: { tr: "Çevir", en: "Convert" },
      sample: "2026-09-25 09:00",
      placeholder: {
        tr: "2026-09-25 09:00 ya da zaman damgası",
        en: "2026-09-25 09:00 or a timestamp",
      },
      run: (input, options, locale) =>
        convertZones(
          input,
          String(options.source),
          String(options.extra),
          locale,
        ),
    },
  ],
  options: [
    {
      kind: "text",
      id: "source",
      label: { tr: "Girdinin dilimi", en: "Input's zone" },
      default: "Europe/Istanbul",
      placeholder: { tr: "Europe/Istanbul", en: "Europe/Istanbul" },
    },
    {
      kind: "text",
      id: "extra",
      label: { tr: "Ek dilimler", en: "Extra zones" },
      default: "",
      placeholder: { tr: "Asia/Seoul", en: "Asia/Seoul" },
    },
  ],
};
