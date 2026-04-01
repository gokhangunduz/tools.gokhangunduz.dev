import { decode, encode, formatBytes } from "@/lib/image";
import type { FileToolSpec } from "../file-tool";

/**
 * Format conversion and downscaling in one tool, because they are the same
 * decision: making an image smaller for the web.
 */
export const spec: FileToolSpec = {
  accept: "image/*",
  options: [
    {
      kind: "select",
      id: "format",
      label: { tr: "Biçim", en: "Format" },
      default: "image/webp",
      choices: [
        { value: "image/webp", label: { tr: "WebP", en: "WebP" } },
        { value: "image/jpeg", label: { tr: "JPEG", en: "JPEG" } },
        { value: "image/png", label: { tr: "PNG", en: "PNG" } },
        { value: "image/avif", label: { tr: "AVIF", en: "AVIF" } },
      ],
    },
    {
      kind: "select",
      id: "quality",
      label: { tr: "Kalite", en: "Quality" },
      default: "0.8",
      choices: ["0.5", "0.65", "0.8", "0.9", "1"].map((value) => ({
        value,
        label: {
          tr: `%${Math.round(Number(value) * 100)}`,
          en: `${Math.round(Number(value) * 100)}%`,
        },
      })),
    },
    {
      kind: "select",
      id: "maxWidth",
      label: { tr: "En fazla genişlik", en: "Max width" },
      default: "0",
      choices: ["0", "640", "1024", "1600", "2048"].map((value) => ({
        value,
        label: {
          tr: value === "0" ? "değiştirme" : `${value}px`,
          en: value === "0" ? "keep" : `${value}px`,
        },
      })),
    },
  ],
  run: async (file, options) => {
    const bitmap = await decode(file);
    const type = String(options.format);
    const maxWidth = Number(options.maxWidth) || null;

    const { blob, width, height } = await encode(
      bitmap,
      type,
      Number(options.quality),
      maxWidth,
    );
    bitmap.close();

    const extension = type.split("/")[1];
    const saving = Math.round((1 - blob.size / file.size) * 100);

    return {
      blob,
      filename: `${file.name.replace(/\.[^.]+$/, "")}.${extension}`,
      note: {
        tr: `${formatBytes(file.size)} → ${formatBytes(blob.size)} (${saving >= 0 ? "-" : "+"}%${Math.abs(saving)}) · ${width}×${height}`,
        en: `${formatBytes(file.size)} → ${formatBytes(blob.size)} (${saving >= 0 ? "-" : "+"}${Math.abs(saving)}%) · ${width}×${height}`,
      },
    };
  },
};
