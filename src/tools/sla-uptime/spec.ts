import type { TextToolSpec } from "../text-tool";
import { describeSla } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "describe",
      label: { tr: "Hesapla", en: "Calculate" },
      sample: "99.9",
      placeholder: { tr: "99.9", en: "99.9" },
      run: (input) => describeSla(input),
    },
  ],
};
