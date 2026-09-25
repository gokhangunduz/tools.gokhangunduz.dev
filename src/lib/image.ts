import { ToolError } from "@/tools/text-tool";

/**
 * Canvas work shared by the image tools.
 *
 * `createImageBitmap` rather than an `<img>` and a load event: it decodes off
 * the main thread, it reports a broken file as a rejection instead of a
 * silent zero-size image, and it does not need the element to be in the
 * document.
 */
export async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new ToolError({
      tr: "Görsel çözümlenemedi. Dosya bozuk ya da desteklenmeyen bir biçimde olabilir.",
      en: "Could not decode the image. The file may be corrupt or in an unsupported format.",
    });
  }
}

export type Encoded = { blob: Blob; width: number; height: number };

export async function encode(
  bitmap: ImageBitmap,
  type: string,
  quality: number,
  maxWidth: number | null,
): Promise<Encoded> {
  const scale =
    maxWidth && bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

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

  // Downscaling in one step is blurry past about 2×; the browser's own
  // smoothing at high quality is the compromise that keeps this simple.
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );

  if (!blob) {
    throw new ToolError({
      tr: `Tarayıcı bu biçimi üretemedi: ${type}`,
      en: `The browser cannot produce this format: ${type}`,
    });
  }

  // Safari falls back to PNG rather than failing when asked for an
  // unsupported type, so the result is checked rather than trusted.
  if (blob.type !== type) {
    throw new ToolError({
      tr: `Tarayıcın ${type} yazamıyor; ${blob.type} üretti.`,
      en: `Your browser cannot write ${type}; it produced ${blob.type}.`,
    });
  }

  return { blob, width, height };
}

export function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
