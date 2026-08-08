import type { Localized } from "@/i18n";
import { positionAt, ToolError } from "../text-tool";

/**
 * Base64 over UTF-8, both alphabets.
 *
 * `btoa` works on Latin-1 code units, so passing it Turkish text throws and
 * passing it the output of `encodeURIComponent` silently encodes the wrong
 * bytes. Going through `TextEncoder` is the only version that round-trips
 * "Şükrü" and an emoji alike.
 */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  // In chunks: `String.fromCharCode(...bytes)` blows the argument limit
  // somewhere around 100 KB, which a pasted certificate reaches easily.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export type Base64Options = {
  /** `-` and `_` instead of `+` and `/`, and no padding. */
  urlSafe: boolean;
  /** Wrap at 76 characters, as MIME does. */
  wrap: boolean;
};

export function encodeBase64(input: string, options: Base64Options): string {
  if (!input) return "";
  let output = toBase64(new TextEncoder().encode(input));
  if (options.urlSafe) {
    output = output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  if (options.wrap) {
    output = output.replace(/.{76}(?=.)/g, "$&\n");
  }
  return output;
}

const DATA_URL = /^\s*data:[^,]*;base64,/i;

export function hasDataUrlPrefix(input: string): boolean {
  return DATA_URL.test(input);
}

const INVALID = {
  tr: "Geçerli bir Base64 değeri değil.",
  en: "Not a valid Base64 value.",
};

/** The first character that cannot be Base64, as an offset into `input`. */
function firstInvalid(input: string, start: number): number {
  let padding = -1;
  for (let i = start; i < input.length; i++) {
    const c = input[i];
    if (/\s/.test(c)) continue;
    if (c === "=") {
      if (padding === -1) padding = i;
      continue;
    }
    if (padding !== -1) return padding;
    if (!/[A-Za-z0-9+/\-_]/.test(c)) return i;
  }
  return -1;
}

export function decodeBytes(input: string): Uint8Array {
  const start = input.match(DATA_URL)?.[0].length ?? 0;
  const invalid = firstInvalid(input, start);
  if (invalid !== -1) {
    const character = String.fromCodePoint(input.codePointAt(invalid)!);
    const shown = /\p{Cc}/u.test(character)
      ? `U+${character.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`
      : `"${character}"`;
    throw new ToolError(
      {
        tr: `Base64'te olmayan karakter: ${shown}.`,
        en: `Not a Base64 character: ${shown}.`,
      },
      { at: positionAt(input, invalid) },
    );
  }

  const cleaned = input.slice(start).replace(/\s+/g, "");
  const normalized = cleaned
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/=+$/, "");
  if (!normalized) return new Uint8Array();
  if (normalized.length % 4 === 1 || cleaned.length - normalized.length > 2) {
    throw new ToolError({
      tr: "Base64 uzunluğu geçersiz: bir karakter eksik ya da fazla.",
      en: "Invalid Base64 length: a character is missing or extra.",
    });
  }

  let binary: string;
  try {
    // `atob` accepts unpadded input in some engines and rejects it in others.
    binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  } catch {
    throw new ToolError(INVALID);
  }
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

const MAGIC: { name: string; bytes: number[] }[] = [
  { name: "PNG", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { name: "JPEG", bytes: [0xff, 0xd8, 0xff] },
  { name: "GIF", bytes: [0x47, 0x49, 0x46, 0x38] },
  { name: "PDF", bytes: [0x25, 0x50, 0x44, 0x46] },
  { name: "ZIP", bytes: [0x50, 0x4b, 0x03, 0x04] },
];

export function sniffBinary(bytes: Uint8Array): string | null {
  return (
    MAGIC.find(({ bytes: magic }) => magic.every((b, i) => bytes[i] === b))
      ?.name ?? null
  );
}

function hexPreview(bytes: Uint8Array): string {
  const head = [...bytes.subarray(0, 32)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
  return bytes.length > 32 ? `${head} …` : head;
}

export function decodeBase64(input: string): string {
  const bytes = decodeBytes(input);
  if (bytes.length === 0) return "";
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    const size = {
      tr: bytes.length.toLocaleString("tr"),
      en: bytes.length.toLocaleString("en"),
    };
    const kind = sniffBinary(bytes);
    if (kind) {
      throw new ToolError({
        tr: `Decode edilen veri bir ${kind} dosyası (${size.tr} bayt), metin değil.`,
        en: `The decoded data is a ${kind} file (${size.en} bytes), not text.`,
      });
    }
    throw new ToolError({
      tr: `Decode edilen ${size.tr} bayt UTF-8 metin değil. İlk baytlar: ${hexPreview(bytes)}`,
      en: `The decoded ${size.en} bytes are not UTF-8 text. First bytes: ${hexPreview(bytes)}`,
    });
  }
}

function format(value: number, locale: "tr" | "en"): string {
  return value.toLocaleString(locale);
}

/** "19 bayt → 28 karakter (+%47)" for encode, "28 karakter → 19 bayt" for decode. */
export function sizeHeadline(
  direction: "encode" | "decode",
  input: string,
  output: string,
): Localized | null {
  if (!input || !output) return null;
  if (direction === "encode") {
    const bytes = new TextEncoder().encode(input).length;
    const chars = output.replace(/\n/g, "").length;
    const growth = Math.round(((chars - bytes) / bytes) * 100);
    const sign = growth >= 0 ? "+" : "−";
    const percent = Math.abs(growth);
    return {
      tr: `${format(bytes, "tr")} bayt → ${format(chars, "tr")} karakter (${sign}%${percent})`,
      en: `${format(bytes, "en")} bytes → ${format(chars, "en")} chars (${sign}${percent}%)`,
    };
  }
  const chars = input.replace(DATA_URL, "").replace(/\s+/g, "").length;
  const bytes = new TextEncoder().encode(output).length;
  return {
    tr: `${format(chars, "tr")} karakter → ${format(bytes, "tr")} bayt`,
    en: `${format(chars, "en")} chars → ${format(bytes, "en")} bytes`,
  };
}
