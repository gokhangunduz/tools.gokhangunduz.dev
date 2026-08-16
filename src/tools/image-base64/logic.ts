import type { Localized } from "@/i18n";
import { formatBytes } from "@/lib/image";
import { ToolError } from "../text-tool";

export type Wrap = "raw" | "base64" | "css" | "img" | "jsx" | "markdown";

export function ensureImage(file: { type: string; name: string }) {
  if (file.type.startsWith("image/")) return;
  const type = file.type || file.name;
  throw new ToolError({
    tr: `Bu bir görsel değil (${type}). PNG, JPEG, GIF, WebP ya da SVG seç.`,
    en: `This is not an image (${type}). Pick a PNG, JPEG, GIF, WebP or SVG.`,
  });
}

export function isSvg(file: { type: string; name: string }): boolean {
  return file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
}

/**
 * An SVG as a URL-encoded data URI: shorter than base64 and still readable.
 * Whitespace between tags is collapsed and, when the markup has no single
 * quotes of its own, double quotes become single so they need no escaping.
 */
export function svgDataUri(svg: string): string {
  let text = svg
    .replace(/^﻿/, "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><");
  if (!text.includes("'")) text = text.replace(/"/g, "'");
  const encoded = encodeURIComponent(text).replace(
    /%(20|3D|3A|2F|27|2C|3B|28|29)/g,
    (_, hex: string) => String.fromCharCode(parseInt(hex, 16)),
  );
  return `data:image/svg+xml,${encoded}`;
}

export function wrapDataUrl(dataUrl: string, wrap: Wrap): string {
  switch (wrap) {
    case "base64":
      return dataUrl.slice(dataUrl.indexOf(",") + 1);
    case "css":
      return `background-image: url("${dataUrl}");`;
    case "img":
      return `<img src="${dataUrl}" alt="">`;
    case "jsx":
      return `<img src="${dataUrl}" alt="" />`;
    case "markdown":
      return `![](${dataUrl})`;
    default:
      return dataUrl;
  }
}

const COMFORTABLE = 4 * 1024;
const TOO_LARGE = 10 * 1024;

export type SizeNote = { text: Localized; warn: boolean };

/** Growth is measured on what gets pasted, wrapper included. */
export function sizeNote(fileSize: number, output: string): SizeNote {
  const size = new TextEncoder().encode(output).length;
  const growth = fileSize > 0 ? Math.round((size / fileSize - 1) * 100) : 0;
  const sign = growth >= 0 ? "+" : "−";
  const head = {
    tr: `${formatBytes(fileSize)} → ${formatBytes(size)} (${sign}%${Math.abs(growth)})`,
    en: `${formatBytes(fileSize)} → ${formatBytes(size)} (${sign}${Math.abs(growth)}%)`,
  };
  if (size > TOO_LARGE) {
    return {
      warn: true,
      text: {
        tr: `${head.tr} · Bu boyutta ayrı dosya olarak sunmak daha iyi`,
        en: `${head.en} · At this size, serving it as a separate file is better`,
      },
    };
  }
  if (size <= COMFORTABLE) {
    return {
      warn: false,
      text: {
        tr: `${head.tr} · küçük; gömmek için uygun`,
        en: `${head.en} · small; fine to inline`,
      },
    };
  }
  return { warn: false, text: head };
}
