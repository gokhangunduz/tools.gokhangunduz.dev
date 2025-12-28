import { ToolError } from "../text-tool";

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
    output = output.replace(/.{76}/g, "$&\n");
  }
  return output;
}

export function decodeBase64(input: string): string {
  const cleaned = input.replace(/\s+/g, "");
  if (!cleaned) return "";

  const normalized = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new ToolError({
      tr: "Geçerli bir Base64 değeri değil.",
      en: "Not a valid Base64 value.",
    });
  }

  // `atob` accepts unpadded input in some engines and rejects it in others.
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new ToolError({
      tr: "Geçerli bir Base64 değeri değil.",
      en: "Not a valid Base64 value.",
    });
  }

  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  // `fatal` so that decoding a PNG as text says so instead of returning a
  // screenful of replacement characters.
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ToolError({
      tr: "Çözülen veri metin değil (ikili dosya olabilir).",
      en: "The decoded data is not text (it may be a binary file).",
    });
  }
}
