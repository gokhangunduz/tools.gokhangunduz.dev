import type { Localized } from "@/i18n";
import { ToolError } from "../text-tool";

export type Format = { mime: string; name: string; extension: string };

export const FORMATS: Format[] = [
  { mime: "image/webp", name: "WebP", extension: "webp" },
  { mime: "image/jpeg", name: "JPEG", extension: "jpg" },
  { mime: "image/png", name: "PNG", extension: "png" },
  { mime: "image/avif", name: "AVIF", extension: "avif" },
];

export function formatOf(mime: string): Format {
  const known = FORMATS.find((format) => format.mime === mime);
  if (known) return known;
  const subtype = (mime.split("/")[1] ?? mime).split("+")[0];
  return { mime, name: subtype.toUpperCase(), extension: subtype };
}

export function isHeic(file: { name: string; type: string }): boolean {
  return (
    /^image\/hei[cf](-sequence)?$/i.test(file.type) ||
    /\.hei[cf]$/i.test(file.name)
  );
}

export function heicError(): ToolError {
  return new ToolError({
    tr: "HEIC/HEIF bu tarayıcıda açılamıyor. iPhone'da Ayarlar › Kamera › Formatlar › En Uyumlu seçilirse fotoğraflar JPEG olarak kaydedilir; ya da dosyayı Safari'de aç.",
    en: "HEIC/HEIF cannot be opened in this browser. On an iPhone, Settings › Camera › Formats › Most Compatible saves photos as JPEG; or open the file in Safari.",
  });
}

export function unsupportedFormat(format: Format): ToolError {
  return new ToolError(
    {
      tr: `Bu tarayıcı ${format.name} yazamıyor. Başka bir format seç.`,
      en: `This browser cannot write ${format.name}. Pick another format.`,
    },
    { field: "format" },
  );
}

export type Fit = "width" | "edge";

/** The output size for a limit on the width or on the longer edge; never upscales. */
export function targetSize(
  width: number,
  height: number,
  limit: number | null,
  fit: Fit,
): { width: number; height: number } {
  const edge = fit === "edge" ? Math.max(width, height) : width;
  if (!limit || edge <= limit) return { width, height };
  const scale = limit / edge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** "" means no limit; anything else must be a whole number of pixels. */
export function parseLimit(value: string): number | null {
  const trimmed = value.trim().replace(/px$/i, "").trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed) || Number(trimmed) < 1) {
    throw new ToolError(
      {
        tr: "Boyut sınırı pozitif bir tam sayı olmalı (px), ya da boş bırak.",
        en: "The size limit must be a positive whole number (px), or left empty.",
      },
      { field: "limit" },
    );
  }
  return Number(trimmed);
}

/** A CSS hex colour, normalised to #rrggbb. */
export function parseColor(value: string): string {
  const hex = value.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return `#${[...hex].map((c) => c + c).join("")}`;
  }
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  throw new ToolError(
    {
      tr: "Arka plan rengi #fff ya da #ffffff biçiminde olmalı.",
      en: "The background colour must look like #fff or #ffffff.",
    },
    { field: "background" },
  );
}

/** Whether any pixel of RGBA data is not fully opaque. */
export function hasAlpha(data: ArrayLike<number>): boolean {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

export function resultNote({
  format,
  width,
  height,
  filled,
}: {
  format: Format;
  width: number;
  height: number;
  filled: string | null;
}): Localized {
  const base = `${width}×${height} · ${format.name}`;
  const extra: Localized | null =
    format.mime === "image/png"
      ? {
          tr: "PNG kayıpsızdır; kalite ayarı yok",
          en: "PNG is lossless; no quality setting",
        }
      : filled
        ? {
            tr: `JPEG saydamlık taşımaz; saydam alanlar ${filled} ile dolduruldu`,
            en: `JPEG has no transparency; transparent areas were filled with ${filled}`,
          }
        : null;
  return extra
    ? { tr: `${base} · ${extra.tr}`, en: `${base} · ${extra.en}` }
    : { tr: base, en: base };
}

export type EncodeOptions = {
  format: Format;
  quality: number;
  limit: number | null;
  fit: Fit;
  background: string;
};

export type Encoded = {
  blob: Blob;
  width: number;
  height: number;
  filled: string | null;
};

const ALPHA_SAMPLE = 256;

export async function encodeImage(
  bitmap: ImageBitmap,
  { format, quality, limit, fit, background }: EncodeOptions,
): Promise<Encoded> {
  const { width, height } = targetSize(bitmap.width, bitmap.height, limit, fit);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new ToolError({
      tr: "Tarayıcı canvas'ı kullanılamadı.",
      en: "The browser's canvas is unavailable.",
    });
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);

  let filled: string | null = null;
  if (format.mime === "image/jpeg") {
    if (sourceHasAlpha(bitmap)) filled = background;
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "source-over";
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, format.mime, quality),
  );
  // Safari hands back a PNG instead of failing on a type it cannot write.
  if (!blob || blob.type !== format.mime) throw unsupportedFormat(format);
  return { blob, width, height, filled };
}

function sourceHasAlpha(bitmap: ImageBitmap): boolean {
  const scale = Math.min(
    1,
    ALPHA_SAMPLE / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  context.drawImage(bitmap, 0, 0, width, height);
  return hasAlpha(context.getImageData(0, 0, width, height).data);
}

/** The formats this browser's canvas can actually write. */
export async function probeFormats(): Promise<Set<string>> {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const results = await Promise.all(
    FORMATS.map(
      (format) =>
        new Promise<string | null>((resolve) => {
          try {
            canvas.toBlob(
              (blob) =>
                resolve(blob?.type === format.mime ? format.mime : null),
              format.mime,
            );
          } catch {
            resolve(null);
          }
        }),
    ),
  );
  return new Set(results.filter((mime): mime is string => mime !== null));
}
