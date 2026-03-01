import type { TextToolSpec } from "../text-tool";
import { slugify } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "slugify",
      label: { tr: "Slug üret", en: "Slugify" },
      sample: "Işık Hızı: Şükrü'nün Çağrısı (2026)",
      placeholder: { tr: "Başlık", en: "Title" },
      run: (input, options) =>
        slugify(input, {
          separator: String(options.separator),
          lower: options.lower !== false,
          strict: options.strict !== false,
        }),
    },
  ],
  options: [
    {
      kind: "select",
      id: "separator",
      label: { tr: "Ayırıcı", en: "Separator" },
      default: "-",
      choices: [
        { value: "-", label: { tr: "tire", en: "hyphen" } },
        { value: "_", label: { tr: "alt çizgi", en: "underscore" } },
        { value: ".", label: { tr: "nokta", en: "dot" } },
      ],
    },
    {
      kind: "switch",
      id: "lower",
      label: { tr: "Küçük harf", en: "Lowercase" },
      default: true,
    },
    {
      kind: "switch",
      id: "strict",
      label: { tr: "Yalnız harf ve rakam", en: "Letters and digits only" },
      default: true,
    },
  ],
};
