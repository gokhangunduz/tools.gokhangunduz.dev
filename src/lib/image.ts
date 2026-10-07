import { ToolError } from "@/tools/text-tool";

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

export function naturalSize(
  src: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () =>
      resolve(
        image.naturalWidth && image.naturalHeight
          ? { width: image.naturalWidth, height: image.naturalHeight }
          : null,
      );
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
