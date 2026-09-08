import type { Localized } from "@/i18n";
import type { DualToolSpec } from "../dual-tool";
import type { DiffData } from "./DiffView";
import {
  diffText,
  formatDiff,
  isIdentical,
  toPatch,
  type Granularity,
} from "./logic";

const UNITS: Record<Granularity, Localized> = {
  line: { tr: "satır", en: "lines" },
  word: { tr: "kelime", en: "words" },
  character: { tr: "karakter", en: "characters" },
};

const lineMode = (values: Record<string, unknown>) =>
  values.granularity === "line";

export const spec: DualToolSpec<DiffData> = {
  left: {
    label: { tr: "Eski", en: "Before" },
    placeholder: {
      tr: "Orijinal metni yapıştır",
      en: "Paste the original text",
    },
    sample:
      "bir satır\nikinci satır\nüçüncü satır\ndördüncü satır\nbeşinci satır\naltıncı satır\nyedinci satır\nsekizinci satır\nson satır",
  },
  right: {
    label: { tr: "Yeni", en: "After" },
    placeholder: {
      tr: "Değişmiş metni yapıştır",
      en: "Paste the changed text",
    },
    sample:
      "bir satır\nikinci satır DEĞİŞTİ\nüçüncü satır\ndördüncü satır\nbeşinci satır\naltıncı satır\nyedinci satır\nsekizinci satır\nson satır\neklenen satır",
  },
  run: async (left, right, options) => {
    const granularity = options.granularity as Granularity;
    const ignoreWhitespace =
      granularity === "line" && options.ignoreWhitespace === true;
    const diff = await diffText(left, right, {
      granularity,
      ignoreCase: options.ignoreCase === true,
      ignoreWhitespace,
    });
    const same = isIdentical(diff);
    const unit = UNITS[granularity];
    return {
      text: formatDiff(diff),
      data: {
        diff,
        context: granularity === "line" && options.onlyChanges ? 0 : 3,
      },
      headline: same
        ? null
        : {
            text: {
              tr: `+${diff.added} −${diff.removed} ${unit.tr}`,
              en: `+${diff.added} −${diff.removed} ${unit.en}`,
            },
          },
      copies:
        granularity === "line" && !same
          ? [
              {
                label: { tr: "Patch olarak kopyala", en: "Copy as patch" },
                text: await toPatch(left, right, ignoreWhitespace),
              },
            ]
          : undefined,
    };
  },
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
    {
      kind: "switch",
      id: "ignoreWhitespace",
      label: { tr: "Boşlukları yok say", en: "Ignore whitespace" },
      hint: {
        tr: "Satır başı ve sonundaki boşluklar fark sayılmaz",
        en: "Spaces at the start and end of a line are not a difference",
      },
      default: false,
      visibleWhen: lineMode,
    },
    {
      kind: "switch",
      id: "onlyChanges",
      label: { tr: "Yalnız farklar", en: "Changes only" },
      hint: {
        tr: "Değişmeyen satırları gizler",
        en: "Hides the unchanged lines",
      },
      default: false,
      visibleWhen: lineMode,
    },
  ],
};
