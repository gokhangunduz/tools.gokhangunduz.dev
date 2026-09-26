import type { DualToolSpec } from "../dual-tool";
import { diffJson, formatChanges, type Change } from "./logic";

export const spec: DualToolSpec<Change[]> = {
  left: {
    label: { tr: "Eski JSON", en: "Before" },
    placeholder: { tr: "Eski JSON'u yapıştır", en: "Paste the old JSON" },
    sample:
      '{\n  "name": "api",\n  "port": 8080,\n  "flags": ["a", "b"],\n  "users": [\n    { "id": 1, "role": "admin" },\n    { "id": 2, "role": "editor" }\n  ]\n}',
  },
  right: {
    label: { tr: "Yeni JSON", en: "After" },
    placeholder: { tr: "Yeni JSON'u yapıştır", en: "Paste the new JSON" },
    sample:
      '{\n  "port": 9090,\n  "name": "api",\n  "flags": ["b", "a"],\n  "users": [\n    { "id": 1, "role": "admin" },\n    { "id": 2, "role": "viewer" },\n    { "id": 3, "role": "editor" }\n  ],\n  "debug": true\n}',
  },
  bothRequired: true,
  run: (left, right, options) => {
    const changes = diffJson(left, right, options.ignoreArrayOrder === true);
    if (!changes) return { text: "" };
    const n = changes.length;
    return {
      text: formatChanges(changes),
      data: changes,
      headline:
        n === 0
          ? null
          : {
              text: {
                tr: `${n} fark`,
                en: `${n} ${n === 1 ? "difference" : "differences"}`,
              },
            },
    };
  },
  options: [
    {
      kind: "switch",
      id: "ignoreArrayOrder",
      label: { tr: "Array sırasını yok say", en: "Ignore array order" },
      hint: {
        tr: "Array'ler küme gibi karşılaştırılır; tekrar eden öğeler yine sayılır",
        en: "Arrays compare as multisets; repeated items still count",
      },
      default: false,
    },
  ],
};
