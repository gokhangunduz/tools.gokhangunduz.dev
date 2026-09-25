import type { TextToolSpec } from "../text-tool";
import { processLines, type Operation } from "./logic";

const OPERATIONS: { id: Operation; tr: string; en: string }[] = [
  { id: "sort", tr: "Sırala", en: "Sort" },
  { id: "sort-desc", tr: "Ters sırala", en: "Sort ↓" },
  { id: "unique", tr: "Tekilleştir", en: "Unique" },
  { id: "count-duplicates", tr: "Tekrarları say", en: "Count" },
  { id: "reverse", tr: "Ters çevir", en: "Reverse" },
  { id: "shuffle", tr: "Karıştır", en: "Shuffle" },
  { id: "number", tr: "Numaralandır", en: "Number" },
  { id: "trim", tr: "Kırp", en: "Trim" },
  { id: "remove-empty", tr: "Boşları sil", en: "Drop empty" },
];

export const spec: TextToolSpec = {
  directions: OPERATIONS.map((operation) => ({
    id: operation.id,
    label: { tr: operation.tr, en: operation.en },
    sample: "zebra\nçilek\narmut\nÇilek\n\nzeytin\narmut",
    run: (input, options) =>
      processLines(input, {
        operation: operation.id,
        caseSensitive: options.caseSensitive === true,
      }),
  })),
  options: [
    {
      kind: "switch",
      id: "caseSensitive",
      label: { tr: "Büyük/küçük harfe duyarlı", en: "Case sensitive" },
      default: false,
    },
  ],
};
