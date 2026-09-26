import { decode } from "@/lib/image";
import type { FileToolSpec } from "../file-tool";
import {
  encodeImage,
  FORMATS,
  formatOf,
  heicError,
  isHeic,
  parseColor,
  parseLimit,
  resultNote,
  unsupportedFormat,
  type Fit,
} from "./logic";

/**
 * Format conversion and downscaling in one tool, because they are the same
 * decision: making an image smaller for the web.
 *
 * `supported` is what the browser's canvas can write, probed on mount; until
 * then every format is offered and a failed one is reported by name.
 */
export function makeSpec(supported: Set<string> | null): FileToolSpec {
  return {
    accept: "image/*",
    options: [
      {
        kind: "select",
        id: "format",
        label: { tr: "Format", en: "Format" },
        default: "image/webp",
        choices: FORMATS.map((format) => {
          const missing = supported !== null && !supported.has(format.mime);
          return {
            value: format.mime,
            label: missing
              ? {
                  tr: `${format.name} (bu tarayıcıda yok)`,
                  en: `${format.name} (not in this browser)`,
                }
              : { tr: format.name, en: format.name },
          };
        }),
      },
      {
        kind: "select",
        id: "quality",
        label: { tr: "Kalite", en: "Quality" },
        default: "0.8",
        visibleWhen: (values) => values.format !== "image/png",
        choices: ["0.5", "0.65", "0.8", "0.9", "1"].map((value) => ({
          value,
          label: {
            tr: `%${Math.round(Number(value) * 100)}`,
            en: `${Math.round(Number(value) * 100)}%`,
          },
        })),
      },
      {
        kind: "text",
        id: "background",
        label: { tr: "Arka plan", en: "Background" },
        default: "#fff",
        width: "sm",
        hint: {
          tr: "JPEG saydamlık taşımaz; saydam alanlar bu renkle doldurulur.",
          en: "JPEG has no transparency; transparent areas are filled with this colour.",
        },
        visibleWhen: (values) => values.format === "image/jpeg",
      },
      {
        kind: "select",
        id: "fit",
        label: { tr: "Sınır", en: "Limit" },
        default: "width",
        choices: [
          { value: "width", label: { tr: "Genişlik", en: "Width" } },
          { value: "edge", label: { tr: "Uzun kenar", en: "Long edge" } },
        ],
      },
      {
        kind: "text",
        id: "limit",
        label: { tr: "En fazla", en: "At most" },
        default: "",
        width: "sm",
        placeholder: { tr: "orijinal", en: "original" },
        hint: {
          tr: "Piksel. Boş bırakılırsa boyut değişmez; görsel hiçbir zaman büyütülmez.",
          en: "Pixels. Empty keeps the size; the image is never enlarged.",
        },
      },
    ],
    run: async (file, options) => {
      const format = formatOf(String(options.format));
      if (supported && !supported.has(format.mime)) {
        throw unsupportedFormat(format);
      }
      const limit = parseLimit(String(options.limit));
      const background =
        format.mime === "image/jpeg"
          ? parseColor(String(options.background))
          : "#ffffff";

      let bitmap: ImageBitmap;
      try {
        bitmap = await decode(file);
      } catch (cause) {
        if (isHeic(file)) throw heicError();
        throw cause;
      }

      try {
        const { blob, width, height, filled } = await encodeImage(bitmap, {
          format,
          quality: Number(options.quality),
          limit,
          fit: (options.fit === "edge" ? "edge" : "width") as Fit,
          background,
        });
        return {
          blob,
          filename: `${file.name.replace(/\.[^.]+$/, "")}.${format.extension}`,
          stats: { before: file.size, after: blob.size },
          note: resultNote({ format, width, height, filled }),
        };
      } finally {
        bitmap.close();
      }
    },
  };
}

export const spec = makeSpec(null);
