import type { TextToolSpec } from "../text-tool";
import { convertCase, type Style } from "./logic";

const STYLES: { id: Style; tr: string; en: string }[] = [
  { id: "camel", tr: "camelCase", en: "camelCase" },
  { id: "pascal", tr: "PascalCase", en: "PascalCase" },
  { id: "snake", tr: "snake_case", en: "snake_case" },
  { id: "kebab", tr: "kebab-case", en: "kebab-case" },
  { id: "constant", tr: "CONSTANT_CASE", en: "CONSTANT_CASE" },
  { id: "title", tr: "Başlık", en: "Title Case" },
  { id: "sentence", tr: "Cümle", en: "Sentence case" },
  { id: "upper", tr: "BÜYÜK", en: "UPPERCASE" },
  { id: "lower", tr: "küçük", en: "lowercase" },
];

export const spec: TextToolSpec = {
  directions: STYLES.map((style) => ({
    id: style.id,
    label: { tr: style.tr, en: style.en },
    sample: "kullanıcı adı ve İstanbul ışık hızı",
    run: (input, options) =>
      convertCase(input, style.id, options.turkish !== false),
  })),
  options: [
    {
      kind: "switch",
      id: "turkish",
      label: { tr: "Türkçe kuralları (İ/ı)", en: "Turkish rules (İ/ı)" },
      default: true,
    },
  ],
};
