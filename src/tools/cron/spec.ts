import type { TextToolSpec } from "../text-tool";
import { explainCron } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "explain",
      label: { tr: "Açıkla", en: "Explain" },
      sample: "0 9 * * 1-5",
      placeholder: { tr: "0 9 * * 1-5", en: "0 9 * * 1-5" },
      run: (input, options, locale) =>
        explainCron(
          input,
          locale,
          String(options.timeZone),
          Number(options.count),
        ),
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
    {
      kind: "select",
      id: "count",
      label: { tr: "Kaç çalışma", en: "How many runs" },
      default: "5",
      choices: ["3", "5", "10"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
  ],
};
