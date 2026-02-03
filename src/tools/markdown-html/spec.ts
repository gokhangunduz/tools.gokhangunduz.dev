import type { TextToolSpec } from "../text-tool";
import { markdownToHtml } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "to-html",
      label: { tr: "Markdown → HTML", en: "Markdown → HTML" },
      sample:
        "# Başlık\n\nBir **kalın** ve bir [bağlantı](https://gokhangunduz.dev).\n\n- bir\n- iki\n\n| a | b |\n|---|---|\n| 1 | 2 |",
      run: (input, options) => markdownToHtml(input, options.breaks === true),
      footnote: () => ({
        tr: "Çıktı temizlenmez: HTML etiketleri yazdığın gibi geçer.",
        en: "The output is not sanitized: raw HTML passes through as written.",
      }),
    },
  ],
  options: [
    {
      kind: "switch",
      id: "breaks",
      label: { tr: "Tek satır sonu = <br>", en: "Single newline = <br>" },
      default: false,
    },
  ],
  outputExtension: "html",
};
