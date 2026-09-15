import { positionAt, ToolError } from "../text-tool";

/**
 * Percent-encoding in three scopes.
 *
 * "value" is `encodeURIComponent`, for a query value or a path segment: it
 * escapes `&`, `=`, `/` and `?`, which would otherwise change the URL around
 * it. "url" is `encodeURI`, for a URL that is already assembled. "form" is
 * the value scope with `+` for a space, as in form-encoded bodies.
 */
export type Scope = "value" | "url" | "form";

export function toScope(value: unknown): Scope {
  return value === "url" || value === "form" ? value : "value";
}

export function encodeUrl(input: string, scope: Scope): string {
  try {
    if (scope === "url") return encodeURI(input);
    const encoded = encodeURIComponent(input);
    return scope === "form" ? encoded.replace(/%20/g, "+") : encoded;
  } catch {
    const index = [...input].findIndex((c) => /\p{Cs}/u.test(c));
    throw new ToolError(
      {
        tr: "Metinde yarım bir UTF-16 surrogate var; encode edilemez.",
        en: "The text contains a lone UTF-16 surrogate and cannot be encoded.",
      },
      index === -1
        ? {}
        : { at: positionAt(input, codeUnitOffset(input, index)) },
    );
  }
}

function codeUnitOffset(input: string, codePointIndex: number): number {
  return [...input].slice(0, codePointIndex).join("").length;
}

const MALFORMED = /%(?![0-9A-Fa-f]{2})/;

export function decodeUrl(input: string, scope: Scope): string {
  const source = scope === "form" ? input.replace(/\+/g, " ") : input;
  const malformed = MALFORMED.exec(source);
  if (malformed) {
    const snippet = source.slice(malformed.index, malformed.index + 3);
    throw new ToolError(
      {
        tr: `Geçersiz percent-encoding: "${snippet}". % işaretinden sonra iki hex basamak gelmeli.`,
        en: `Malformed percent-encoding: "${snippet}". A % must be followed by two hex digits.`,
      },
      { at: positionAt(input, malformed.index) },
    );
  }
  try {
    return scope === "url" ? decodeURI(source) : decodeURIComponent(source);
  } catch {
    const offset = firstNonUtf8(source);
    throw new ToolError(
      {
        tr: "Escape'ler geçerli ama baytlar UTF-8 değil; Latin-1 ya da Windows-1254 olabilir.",
        en: "The escapes are valid but the bytes are not UTF-8; they may be Latin-1 or Windows-1254.",
      },
      offset === -1 ? {} : { at: positionAt(input, offset) },
    );
  }
}

/** Offset of the first run of escapes that is not valid UTF-8, or -1. */
function firstNonUtf8(input: string): number {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (const run of input.matchAll(/(?:%[0-9A-Fa-f]{2})+/g)) {
    const bytes = Uint8Array.from(
      run[0].match(/[0-9A-Fa-f]{2}/g)!.map((hex) => parseInt(hex, 16)),
    );
    try {
      decoder.decode(bytes);
    } catch {
      return run.index;
    }
  }
  return -1;
}

/** Whether text meant for Encode already looks percent-encoded. */
export function looksEncoded(input: string): boolean {
  if (!/%[0-9A-F]{2}/i.test(input)) return false;
  try {
    return decodeURIComponent(input) !== input;
  } catch {
    return false;
  }
}
