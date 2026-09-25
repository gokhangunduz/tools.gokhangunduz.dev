import { ToolError } from "../text-tool";

/**
 * Text as ones and zeros, over UTF-8 bytes.
 *
 * Eight bits per group, which is what makes the output readable and what every
 * other tool that prints binary does. Grouping by code unit instead would put
 * sixteen bits on screen for a character that occupies two bytes on the wire.
 */
export function textToBinary(input: string, spaced: boolean): string {
  const bytes = new TextEncoder().encode(input);
  const parts = Array.from(bytes, (byte) => byte.toString(2).padStart(8, "0"));
  return parts.join(spaced ? " " : "");
}

export function binaryToText(input: string): string {
  const cleaned = input.replace(/[\s,]/g, "");
  if (!cleaned) return "";

  if (!/^[01]+$/.test(cleaned)) {
    throw new ToolError({
      tr: "Yalnızca 0 ve 1 olmalı.",
      en: "Only 0 and 1 are allowed.",
    });
  }
  if (cleaned.length % 8 !== 0) {
    throw new ToolError({
      tr: "Bit sayısı 8'in katı değil.",
      en: "The number of bits is not a multiple of 8.",
    });
  }

  const bytes = new Uint8Array(cleaned.length / 8);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(cleaned.slice(i * 8, i * 8 + 8), 2);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ToolError({
      tr: "Baytlar geçerli UTF-8 metni değil.",
      en: "Those bytes are not valid UTF-8 text.",
    });
  }
}
