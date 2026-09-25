import type { TextToolSpec } from "../text-tool";
import { describeSize } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "convert",
      label: { tr: "Çevir", en: "Convert" },
      sample: "1 TB",
      placeholder: { tr: "1536, 1.5 MB, 2 GiB…", en: "1536, 1.5 MB, 2 GiB…" },
      run: (input) => describeSize(input),
    },
  ],
};
