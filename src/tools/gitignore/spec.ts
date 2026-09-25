import type { GeneratorSpec } from "../generator-tool";
import { AVAILABLE, build } from "./logic";

export const spec: GeneratorSpec = {
  generate: (options) => build(String(options.sections)),
  options: [
    {
      kind: "text",
      id: "sections",
      label: { tr: "B\u00f6l\u00fcmler", en: "Sections" },
      default: "node, next, env, macos, vscode",
      placeholder: { tr: "node, python, macos", en: "node, python, macos" },
    },
  ],
  outputExtension: "gitignore",
  footnote: () => ({
    tr: `Kullan\u0131labilir: ${AVAILABLE.join(", ")}`,
    en: `Available: ${AVAILABLE.join(", ")}`,
  }),
};
