import type { TextToolSpec } from "../text-tool";
import { run, type Mode } from "./logic";

const SAMPLE = "1.2.3\n0.2.3\n2.0.0-beta.1";

function direction(id: Mode, tr: string, en: string) {
  return {
    id,
    label: { tr, en },
    sample: SAMPLE,
    placeholder: { tr: "Her satıra bir sürüm", en: "One version per line" },
    run: (input: string, options: Record<string, string | boolean>) =>
      run(input, id, String(options.range), String(options.release)),
  };
}

export const spec: TextToolSpec = {
  directions: [
    direction("parse", "Çözümle", "Parse"),
    direction("satisfies", "Aralığa uyuyor mu", "Satisfies"),
    direction("sort", "Sırala", "Sort"),
    direction("increment", "Artır", "Increment"),
  ],
  options: [
    {
      kind: "text",
      id: "range",
      label: { tr: "Aralık", en: "Range" },
      default: "^1.2.0",
      placeholder: { tr: "^1.2.0", en: "^1.2.0" },
    },
    {
      kind: "select",
      id: "release",
      label: { tr: "Artırım", en: "Increment" },
      default: "patch",
      choices: ["major", "minor", "patch", "prerelease"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
  ],
};
