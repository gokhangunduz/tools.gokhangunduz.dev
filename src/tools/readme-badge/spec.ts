import type { GeneratorSpec } from "../generator-tool";
import { build, type Style } from "./logic";

export const spec: GeneratorSpec = {
  generate: (options) =>
    build({
      repo: String(options.repo),
      style: options.style as Style,
      format: options.format === "html" ? "html" : "markdown",
      extra: String(options.extra),
    }),
  options: [
    {
      kind: "text",
      id: "repo",
      label: { tr: "Depo", en: "Repository" },
      default: "gokhangunduz/tools",
      placeholder: { tr: "kullan\u0131c\u0131/proje", en: "owner/name" },
    },
    {
      kind: "select",
      id: "style",
      label: { tr: "Bi\u00e7em", en: "Style" },
      default: "flat",
      choices: ["flat", "flat-square", "for-the-badge", "plastic"].map(
        (value) => ({
          value,
          label: { tr: value, en: value },
        }),
      ),
    },
    {
      kind: "select",
      id: "format",
      label: { tr: "\u00c7\u0131kt\u0131", en: "Output" },
      default: "markdown",
      choices: [
        { value: "markdown", label: { tr: "Markdown", en: "Markdown" } },
        { value: "html", label: { tr: "HTML", en: "HTML" } },
      ],
    },
    {
      kind: "text",
      id: "extra",
      label: { tr: "Ek rozet", en: "Custom badge" },
      default: "",
      placeholder: { tr: "etiket:de\u011fer:renk", en: "label:message:colour" },
    },
  ],
  outputExtension: "md",
};
