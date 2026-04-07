import { decode } from "@/lib/image";
import { ToolError } from "../text-tool";

/**
 * Reads a QR code out of an image file.
 *
 * Screenshots of codes are usually scaled or slightly rotated, and jsQR wants
 * raw pixels, so the image is drawn to a canvas first. It is tried at full
 * size and then inverted, which covers the light-on-dark codes that dark-mode
 * screenshots produce.
 */
export async function readQr(file: File): Promise<string> {
  const bitmap = await decode(file);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new ToolError({
      tr: "Tarayıcı canvas'ı kullanılamadı.",
      en: "The browser's canvas is unavailable.",
    });
  }
  context.drawImage(bitmap, 0, 0);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const jsQR = (await import("jsqr")).default;

  for (const inversion of ["dontInvert", "onlyInvert"] as const) {
    const result = jsQR(pixels.data, pixels.width, pixels.height, {
      inversionAttempts: inversion,
    });
    if (result?.data) return result.data;
  }

  throw new ToolError({
    tr: "Görselde QR kodu bulunamadı. Kodun tamamı karede ve net olmalı.",
    en: "No QR code found in the image. The whole code must be in frame and in focus.",
  });
}

/** What the payload turns out to be, which is usually the actual question. */
export function describePayload(value: string): string {
  if (/^https?:\/\//i.test(value)) return "URL";
  if (/^WIFI:/i.test(value)) return "Wi-Fi";
  if (/^BEGIN:VCARD/i.test(value)) return "vCard";
  if (/^BEGIN:VEVENT/i.test(value)) return "iCalendar";
  if (/^mailto:/i.test(value)) return "e-posta / email";
  if (/^tel:/i.test(value)) return "telefon / phone";
  if (/^otpauth:\/\//i.test(value)) return "TOTP";
  if (/^bitcoin:|^ethereum:/i.test(value))
    return "kripto adresi / crypto address";
  return "metin / text";
}
