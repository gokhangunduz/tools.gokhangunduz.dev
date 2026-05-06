import type { GeneratorSpec } from "../generator-tool";
import { build, review, TYPES, type Type } from "./logic";

function read(values: Record<string, string | boolean>) {
  return {
    type: values.type as Type,
    scope: String(values.scope),
    subject: String(values.subject),
    body: String(values.body),
    breaking: String(values.breaking),
    issue: String(values.issue),
  };
}

export const spec: GeneratorSpec = {
  generate: (values) => build(read(values)),
  options: [
    {
      kind: "select",
      id: "type",
      label: { tr: "T\u00fcr", en: "Type" },
      default: "feat",
      choices: TYPES.map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "text",
      id: "scope",
      label: { tr: "Kapsam", en: "Scope" },
      default: "",
      placeholder: { tr: "auth, ui\u2026", en: "auth, ui\u2026" },
    },
    {
      kind: "text",
      id: "subject",
      label: { tr: "Konu", en: "Subject" },
      default: "d\u0131\u015fa aktarma d\u00fc\u011fmesini ekle",
      placeholder: {
        tr: "emir kipiyle, k\u00fc\u00e7\u00fck harf",
        en: "imperative, lowercase",
      },
    },
    {
      kind: "text",
      id: "body",
      label: { tr: "G\u00f6vde", en: "Body" },
      default: "",
      placeholder: { tr: "neden gerekti", en: "why it was needed" },
    },
    {
      kind: "text",
      id: "breaking",
      label: {
        tr: "K\u0131r\u0131c\u0131 de\u011fi\u015fiklik",
        en: "Breaking change",
      },
      default: "",
      placeholder: { tr: "ne bozuldu", en: "what broke" },
    },
    {
      kind: "text",
      id: "issue",
      label: { tr: "Konu numaras\u0131", en: "Issue" },
      default: "",
      placeholder: { tr: "12, 34", en: "12, 34" },
    },
  ],
  footnote: (_output, values) => {
    const notes = review(read(values), "tr");
    const english = review(read(values), "en");
    return notes && english
      ? { tr: `\u26a0 ${notes}`, en: `\u26a0 ${english}` }
      : null;
  },
};
