const MAX_SHARE_BYTES = 4096;

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
    return null;
  }
}

export type SharedState = {
  input: string;
  direction?: string;
  options?: Record<string, unknown>;
};

export function subscribeShared(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function readSharedHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.slice(1);
}

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

export function writeShared(state: SharedState) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const fragment = formatShared(state);
  if (url.hash.slice(1) === fragment) return;
  url.hash = fragment;
  window.history.replaceState(null, "", url.toString().replace(/#$/, ""));
}

export function encodeShared(value: string): string {
  const encoded = encode(value);
  return encoded.length <= MAX_SHARE_BYTES ? encoded : "";
}

export function shareable(value: string): boolean {
  return value.length > 0 && encode(value).length <= MAX_SHARE_BYTES;
}
