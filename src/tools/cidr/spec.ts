import type { TextToolSpec } from "../text-tool";
import { describeCidr } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "describe",
      label: { tr: "Hesapla", en: "Calculate" },
      sample: "10.20.30.40/22",
      placeholder: { tr: "192.168.1.0/24", en: "192.168.1.0/24" },
      run: (input) => describeCidr(input),
    },
  ],
};
