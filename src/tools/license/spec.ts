import type { GeneratorSpec } from "../generator-tool";
import { render, SUMMARIES, type LicenseId } from "./logic";

export const spec: GeneratorSpec = {
  generate: (options) =>
    render(
      options.license as LicenseId,
      String(options.year),
      String(options.holder),
    ),
  options: [
    {
      kind: "select",
      id: "license",
      label: { tr: "Lisans", en: "Licence" },
      default: "mit",
      choices: [
        { value: "mit", label: { tr: "MIT", en: "MIT" } },
        { value: "apache-2.0", label: { tr: "Apache 2.0", en: "Apache 2.0" } },
        { value: "bsd-3", label: { tr: "BSD 3-Clause", en: "BSD 3-Clause" } },
        { value: "gpl-3.0", label: { tr: "GPL 3.0", en: "GPL 3.0" } },
        { value: "agpl-3.0", label: { tr: "AGPL 3.0", en: "AGPL 3.0" } },
        { value: "unlicense", label: { tr: "Unlicense", en: "Unlicense" } },
      ],
    },
    {
      kind: "text",
      id: "holder",
      label: { tr: "Telif sahibi", en: "Copyright holder" },
      default: "G\u00f6khan G\u00fcnd\u00fcz",
      placeholder: { tr: "Ad Soyad", en: "Your name" },
    },
    {
      kind: "text",
      id: "year",
      label: { tr: "Y\u0131l", en: "Year" },
      default: String(new Date().getFullYear()),
      placeholder: { tr: "2026", en: "2026" },
    },
  ],
  outputExtension: "txt",
  footnote: (_output, options) => SUMMARIES[options.license as LicenseId],
};
