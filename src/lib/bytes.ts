/**
 * The byte plumbing every encoding tool needs.
 *
 * `btoa`/`atob` work on Latin-1 code units, so anything that touches them has
 * to go through `TextEncoder` first or it corrupts non-ASCII text. Keeping
 * that in one place means each tool gets it right by not implementing it.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  // In chunks: spreading a large array into `fromCharCode` blows the argument
  // limit somewhere around 100 KB, which a pasted certificate reaches easily.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Accepts both alphabets, with or without padding. Throws on anything else. */
export function base64ToBytes(value: string): Uint8Array {
  const normalized = value
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function textToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

/** `fatal` so binary data reports itself instead of returning replacement characters. */
export function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
