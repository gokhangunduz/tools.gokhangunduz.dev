import type { TextToolSpec } from "../text-tool";
import { describeMode } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "describe",
      label: { tr: "Çözümle", en: "Describe" },
      sample: "755",
      placeholder: { tr: "755 ya da rwxr-xr-x", en: "755 or rwxr-xr-x" },
      run: (input) => describeMode(input),
    },
  ],
};
