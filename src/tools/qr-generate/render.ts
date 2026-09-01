import { ToolError } from "../text-tool";
import type { Level } from "./logic";

/** A PNG of the code at a pixel size, drawn by the same library as the SVG. */
export async function toPng(
  payload: string,
  level: Level,
  margin: number,
  size: number,
): Promise<Blob> {
  const QRCode = (await import("qrcode")).default;
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, payload, {
    errorCorrectionLevel: level,
    margin,
    width: size,
  });
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) {
    throw new ToolError({
      tr: "PNG üretilemedi.",
      en: "Could not produce the PNG.",
    });
  }
  return blob;
}

export function canCopyImage(): boolean {
  return (
    typeof ClipboardItem !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.write === "function"
  );
}

/** The promise goes inside the ClipboardItem so Safari keeps the user gesture. */
export async function copyPng(png: Promise<Blob>): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    return true;
  } catch {
    return false;
  }
}
