import type { DualToolSpec } from "../dual-tool";
import { countChanges, diffJson } from "./logic";

export const spec: DualToolSpec = {
  left: {
    label: { tr: "Eski JSON", en: "Before" },
    sample: '{\n  "name": "api",\n  "port": 8080,\n  "flags": ["a", "b"]\n}',
  },
  right: {
    label: { tr: "Yeni JSON", en: "After" },
    sample:
      '{\n  "port": 9090,\n  "name": "api",\n  "flags": ["b", "a"],\n  "debug": true\n}',
  },
  run: (left, right, options) =>
    diffJson(left, right, options.ignoreArrayOrder === true),
  options: [
    {
      kind: "switch",
      id: "ignoreArrayOrder",
      label: { tr: "Dizi sırasını yok say", en: "Ignore array order" },
      default: false,
    },
  ],
  footnote: (left, right, _output, options) => {
    const count = countChanges(left, right, options.ignoreArrayOrder === true);
    return { tr: `${count} fark`, en: `${count} differences` };
  },
};
