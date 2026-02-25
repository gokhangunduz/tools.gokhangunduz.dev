import type { TextToolSpec } from "../text-tool";
import { describeNumber, type Base } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "convert",
      label: { tr: "Çevir", en: "Convert" },
      sample: "0xdeadbeef",
      placeholder: { tr: "255, 0xff, 0b1010…", en: "255, 0xff, 0b1010…" },
      run: (input, options) =>
        describeNumber(
          input,
          options.base === "auto" ? "auto" : (Number(options.base) as Base),
        ),
    },
  ],
  options: [
    {
      kind: "select",
      id: "base",
      label: { tr: "Girdi tabanı", en: "Input base" },
      default: "auto",
      choices: [
        { value: "auto", label: { tr: "otomatik", en: "auto" } },
        { value: "2", label: { tr: "2", en: "2" } },
        { value: "8", label: { tr: "8", en: "8" } },
        { value: "10", label: { tr: "10", en: "10" } },
        { value: "16", label: { tr: "16", en: "16" } },
        { value: "36", label: { tr: "36", en: "36" } },
      ],
    },
  ],
};
