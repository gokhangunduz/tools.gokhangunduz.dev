import { ToolError } from "../text-tool";

/**
 * Text to hex bytes and back, over UTF-8.
 *
 * Per byte, not per character: "ç" is one character and two bytes, and a tool
 * that prints its UTF-16 code unit instead would disagree with every hexdump
 * the user is comparing against.
 */
export type HexSeparator = "space" | "none" | "0x" | "backslash";

export function textToHex(
  input: string,
  separator: HexSeparator,
  upper: boolean,
): string {
  const bytes = new TextEncoder().encode(input);
  const parts = Array.from(bytes, (byte) => {
    const hex = byte.toString(16).padStart(2, "0");
    return upper ? hex.toUpperCase() : hex;
  });

  if (separator === "none") return parts.join("");
  if (separator === "0x") return parts.map((part) => `0x${part}`).join(", ");
  if (separator === "backslash")
    return parts.map((part) => `\\x${part}`).join("");
  return parts.join(" ");
}

export function hexToText(input: string): string {
  // Everything a hexdump, a C array or a shell escape puts between the bytes.
  const cleaned = input
    .replace(/0x/gi, "")
    .replace(/\\x/gi, "")
    .replace(/[\s,:;-]/g, "");
  if (!cleaned) return "";

  if (!/^[0-9a-f]+$/i.test(cleaned)) {
    throw new ToolError({
      tr: "Onaltılık olmayan karakter var.",
      en: "Contains a character that is not hexadecimal.",
    });
  }
  if (cleaned.length % 2 !== 0) {
    throw new ToolError({
      tr: "Tek sayıda onaltılık basamak: bir bayt yarım kalmış.",
      en: "Odd number of hex digits: one byte is incomplete.",
    });
  }

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
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
