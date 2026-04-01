import { formatBytes, readAsDataUrl } from "@/lib/image";
import type { FileToolSpec } from "../file-tool";

export const spec: FileToolSpec = {
  accept: "image/*",
  options: [
    {
      kind: "select",
      id: "wrap",
      label: { tr: "Sarmalayıcı", en: "Wrapper" },
      default: "raw",
      choices: [
        { value: "raw", label: { tr: "yalın data URI", en: "plain data URI" } },
        { value: "css", label: { tr: "CSS url()", en: "CSS url()" } },
        { value: "img", label: { tr: "HTML <img>", en: "HTML <img>" } },
        { value: "jsx", label: { tr: "JSX", en: "JSX" } },
      ],
    },
  ],
  run: async (file, options) => {
    const dataUrl = await readAsDataUrl(file);
    const wrap = String(options.wrap);

    const text =
      wrap === "css"
        ? `background-image: url("${dataUrl}");`
        : wrap === "img"
          ? `<img src="${dataUrl}" alt="">`
          : wrap === "jsx"
            ? `<img src="${dataUrl}" alt="" />`
            : dataUrl;

    // The base64 expansion is a third, which is the thing to know before
    // inlining a photograph into a stylesheet.
    const growth = Math.round((dataUrl.length / file.size - 1) * 100);

    return {
      text,
      note: {
        tr: `${formatBytes(file.size)} → ${formatBytes(dataUrl.length)} (+%${growth}) · data URI dosyadan büyüktür, küçük ikonlar için uygundur`,
        en: `${formatBytes(file.size)} → ${formatBytes(dataUrl.length)} (+${growth}%) · a data URI is larger than the file; use it for small icons`,
      },
    };
  },
};
