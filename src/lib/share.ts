/**
 * Keeps the tool's input in the URL fragment.
 *
 * The fragment, not the query string: a `#` is never sent to the server, so a
 * shared link carries a JWT or a private payload without it ever reaching a
 * log. That is the same promise the footer makes about the tools themselves.
 *
 * Large inputs are dropped rather than encoded. A megabyte of pasted JSON in
 * the address bar is a link nobody can send and a history entry that costs
 * more than it returns.
 */
const MAX_SHARE_BYTES = 4096;

/** Base64url over UTF-8 — `encodeURIComponent` alone triples the length of Turkish text. */
function encode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decode(value: string): string | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    // A hand-edited or truncated fragment: open the tool empty rather than
    // showing an error about a link the user did not type.
    return null;
  }
}

/** Only the browser's own fragment changes matter; our own writes replace it. */
export function subscribeShared(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function readShared(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.slice(1);
  if (!hash.startsWith("i=")) return null;
  return decode(hash.slice(2));
}

/** Replaces the fragment without adding a history entry, so Back still leaves the tool. */
export function writeShared(value: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const encoded = value ? encode(value) : "";
  url.hash = encoded && encoded.length <= MAX_SHARE_BYTES ? `i=${encoded}` : "";
  window.history.replaceState(null, "", url.toString().replace(/#$/, ""));
}

export function shareable(value: string): boolean {
  return value.length > 0 && encode(value).length <= MAX_SHARE_BYTES;
}
