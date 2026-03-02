import type { DualToolSpec } from "../dual-tool";
import { countChanges, diffText, type Granularity } from "./logic";

export const spec: DualToolSpec = {
  left: {
    label: { tr: "Eski", en: "Before" },
    sample: "bir satır\nikinci satır\nüçüncü satır",
  },
  right: {
    label: { tr: "Yeni", en: "After" },
    sample: "bir satır\nDEĞİŞEN satır\nüçüncü satır\ndördüncü satır",
  },
  run: (left, right, options) =>
    diffText(
      left,
      right,
      options.granularity as Granularity,
      options.ignoreCase === true,
    ),
  options: [
    {
      kind: "select",
      id: "granularity",
      label: { tr: "Karşılaştırma", en: "Compare by" },
      default: "line",
      choices: [
        { value: "line", label: { tr: "satır", en: "line" } },
        { value: "word", label: { tr: "kelime", en: "word" } },
        { value: "character", label: { tr: "karakter", en: "character" } },
      ],
    },
    {
      kind: "switch",
      id: "ignoreCase",
      label: { tr: "Büyük/küçük harfi yok say", en: "Ignore case" },
      default: false,
    },
  ],
};

/** The counts are async, so they are attached after the fact by the component. */
export { countChanges };
