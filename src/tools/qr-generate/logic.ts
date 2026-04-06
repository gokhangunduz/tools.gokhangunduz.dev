import { ToolError } from "../text-tool";

/**
 * A QR code as SVG, so it stays sharp at any size and can be pasted into a
 * document as markup.
 *
 * The error-correction level is exposed because it is the one setting with a
 * real trade-off: a code printed on a label or covered by a logo needs H,
 * and a code on a screen wastes a third of its capacity on it.
 */
export type Level = "L" | "M" | "Q" | "H";

export async function toSvg(
  input: string,
  level: Level,
  margin: number,
): Promise<string> {
  if (!input.trim()) return "";

  const QRCode = (await import("qrcode")).default;
  try {
    return await QRCode.toString(input, {
      type: "svg",
      errorCorrectionLevel: level,
      margin,
      // Colours are left to CSS: the SVG inherits `currentColor` so the code
      // is legible in both themes without generating it twice.
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    if (
      message.includes("too big") ||
      message.includes("code length overflow")
    ) {
      throw new ToolError({
        tr: "Metin bu hata düzeltme seviyesi için çok uzun. Seviyeyi düşür ya da metni kısalt.",
        en: "The text is too long for this error-correction level. Lower the level or shorten the text.",
      });
    }
    throw new ToolError({
      tr: `QR üretilemedi: ${message}`,
      en: `Could not generate the QR code: ${message}`,
    });
  }
}

/** Capacity, so "too long" is a number rather than a surprise. */
export const CAPACITY: Record<Level, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};
