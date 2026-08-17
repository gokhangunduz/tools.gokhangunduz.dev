import { readAsDataUrl } from "@/lib/image";
import type { FileToolSpec } from "../file-tool";
import {
  ensureImage,
  isSvg,
  sizeNote,
  svgDataUri,
  wrapDataUrl,
  type Wrap,
} from "./logic";

export const spec: FileToolSpec = {
  accept: "image/*",
  options: [
    {
      kind: "select",
      id: "wrap",
      label: { tr: "Biçim", en: "Format" },
      default: "raw",
      choices: [
        { value: "raw", label: { tr: "Yalın data URI", en: "Plain data URI" } },
        { value: "base64", label: { tr: "Yalnız base64", en: "Base64 only" } },
        { value: "css", label: { tr: "CSS url()", en: "CSS url()" } },
        { value: "img", label: { tr: "HTML <img>", en: "HTML <img>" } },
        { value: "jsx", label: { tr: "JSX", en: "JSX" } },
        { value: "markdown", label: { tr: "Markdown", en: "Markdown" } },
      ],
    },
    {
      kind: "select",
      id: "svg",
      label: { tr: "SVG kodlaması", en: "SVG encoding" },
      default: "url",
      hint: {
        tr: "Yalnız SVG dosyalarında kullanılır; URL-encoded çoğu zaman base64'ten kısadır.",
        en: "Used for SVG files only; URL-encoded is usually shorter than base64.",
      },
      visibleWhen: (values) => values.wrap !== "base64",
      choices: [
        { value: "url", label: { tr: "URL-encoded", en: "URL-encoded" } },
        { value: "base64", label: { tr: "Base64", en: "Base64" } },
      ],
    },
  ],
  run: async (file, options) => {
    ensureImage(file);
    const wrap = String(options.wrap) as Wrap;
    const base64Url = await readAsDataUrl(file);
    const dataUrl =
      isSvg(file) && wrap !== "base64" && options.svg !== "base64"
        ? svgDataUri(await file.text())
        : base64Url;
    const text = wrapDataUrl(dataUrl, wrap);
    const note = sizeNote(file.size, text);

    return { text, previewUrl: base64Url, note: note.text };
  },
};
