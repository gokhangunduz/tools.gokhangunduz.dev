import type { DualToolSpec } from "../dual-tool";
import { compareLists, summarize, type Operation } from "./logic";

function options(values: Record<string, string | boolean>) {
  return {
    operation: values.operation as Operation,
    caseSensitive: values.caseSensitive === true,
    trim: values.trim !== false,
    sort: values.sort === true,
  };
}

export const spec: DualToolSpec = {
  left: {
    label: { tr: "A listesi", en: "List A" },
    sample: "ahmet@x.dev\nayse@x.dev\nmehmet@x.dev",
  },
  right: {
    label: { tr: "B listesi", en: "List B" },
    sample: "ayse@x.dev\nmehmet@x.dev\nzeynep@x.dev",
  },
  run: (left, right, values) => compareLists(left, right, options(values)),
  options: [
    {
      kind: "select",
      id: "operation",
      label: { tr: "Ne göster", en: "Show" },
      default: "both",
      choices: [
        { value: "both", label: { tr: "ikisinde de olanlar", en: "in both" } },
        { value: "left-only", label: { tr: "yalnız A'da", en: "only in A" } },
        { value: "right-only", label: { tr: "yalnız B'de", en: "only in B" } },
        { value: "all", label: { tr: "hepsi (işaretli)", en: "all, marked" } },
      ],
    },
    {
      kind: "switch",
      id: "caseSensitive",
      label: { tr: "Büyük/küçük harfe duyarlı", en: "Case sensitive" },
      default: false,
    },
    {
      kind: "switch",
      id: "sort",
      label: { tr: "Sırala", en: "Sort" },
      default: false,
    },
  ],
  footnote: (left, right, _output, values) => {
    const counts = summarize(left, right, options(values));
    return {
      tr: `A: ${counts.left} · B: ${counts.right} · ortak: ${counts.shared}`,
      en: `A: ${counts.left} · B: ${counts.right} · shared: ${counts.shared}`,
    };
  },
};
