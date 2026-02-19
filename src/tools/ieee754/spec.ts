import type { TextToolSpec } from "../text-tool";
import { describeFloat, type Precision } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "describe",
      label: { tr: "Çözümle", en: "Describe" },
      sample: "0.1",
      placeholder: {
        tr: "0.1 ya da 0x3fb999999999999a",
        en: "0.1 or 0x3fb999999999999a",
      },
      run: (input, options) =>
        describeFloat(input, options.precision as Precision),
    },
  ],
  options: [
    {
      kind: "select",
      id: "precision",
      label: { tr: "Kesinlik", en: "Precision" },
      default: "double",
      choices: [
        {
          value: "double",
          label: { tr: "double (64 bit)", en: "double (64-bit)" },
        },
        {
          value: "single",
          label: { tr: "float (32 bit)", en: "float (32-bit)" },
        },
      ],
    },
  ],
};
