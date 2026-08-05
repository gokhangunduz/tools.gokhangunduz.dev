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
export function encode(value: string): string {
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

export type SharedState = {
  input: string;
  direction?: string;
  options?: Record<string, unknown>;
};

/** Only the browser's own fragment changes matter; our own writes replace it. */
export function subscribeShared(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** The raw fragment, a stable snapshot for `useSyncExternalStore`. */
export function readSharedHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.slice(1);
}

/**
 * `i=` carries the input alone (links from the search box); `s=` carries
 * `{ i, d, o }`: the input, the direction and the options that differ.
 */
export function parseShared(hash: string): SharedState | null {
  if (hash.startsWith("i=")) {
    const input = decode(hash.slice(2));
    return input === null ? null : { input };
  }
  if (!hash.startsWith("s=")) return null;
  const json = decode(hash.slice(2));
  if (json === null) return null;
  try {
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== "object") return null;
    const { i, d, o } = value as Record<string, unknown>;
    if (typeof i !== "string") return null;
    return {
      input: i,
      direction: typeof d === "string" ? d : undefined,
      options:
        o && typeof o === "object" && !Array.isArray(o)
          ? (o as Record<string, unknown>)
          : undefined,
    };
  } catch {
    return null;
  }
}

export function readShared(): SharedState | null {
  return parseShared(readSharedHash());
}

/** The fragment for a state, without the `#`, or "" when it is empty or too long. */
export function formatShared({
  input,
  direction,
  options,
}: SharedState): string {
  if (!input) return "";
  const state: Record<string, unknown> = { i: input };
  if (direction) state.d = direction;
  if (options && Object.keys(options).length > 0) state.o = options;
  const encoded = encode(JSON.stringify(state));
  return encoded.length <= MAX_SHARE_BYTES ? `s=${encoded}` : "";
}

/** Replaces the fragment without adding a history entry, so Back still leaves the tool. */
export function writeShared(state: SharedState) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const fragment = formatShared(state);
  if (url.hash.slice(1) === fragment) return;
  url.hash = fragment;
  window.history.replaceState(null, "", url.toString().replace(/#$/, ""));
}

/** The fragment a link should carry for this value, or an empty string if it is too long. */
export function encodeShared(value: string): string {
  const encoded = encode(value);
  return encoded.length <= MAX_SHARE_BYTES ? encoded : "";
}

export function shareable(value: string): boolean {
  return value.length > 0 && encode(value).length <= MAX_SHARE_BYTES;
}
