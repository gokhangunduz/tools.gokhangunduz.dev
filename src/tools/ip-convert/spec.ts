import type { TextToolSpec } from "../text-tool";
import { describeAddress } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "describe",
      label: { tr: "Çevir", en: "Convert" },
      sample: "167772161",
      placeholder: {
        tr: "10.0.0.1, 167772161, 0x0a000001…",
        en: "10.0.0.1, 167772161, 0x0a000001…",
      },
      run: (input) => describeAddress(input),
    },
  ],
};
