import { ToolError } from "../text-tool";

/**
 * Percent-encoding, both scopes.
 *
 * `encodeURIComponent` is what you want for a value going into a query string
 * or a path segment: it escapes `&`, `=`, `/` and `?`, which are exactly the
 * characters that would otherwise change the meaning of the URL around it.
 * `encodeURI` leaves those alone and is for encoding a whole URL that is
 * already assembled — it is the wrong default, which is why it is the option
 * rather than the other way round.
 */
export function encodeUrl(input: string, whole: boolean): string {
  return whole ? encodeURI(input) : encodeURIComponent(input);
}

export function decodeUrl(input: string, whole: boolean): string {
  try {
    return whole ? decodeURI(input) : decodeURIComponent(input);
  } catch {
    throw new ToolError({
      tr: "Geçersiz yüzde kodlaması (örneğin tek başına % ya da yarım %A).",
      en: "Malformed percent-encoding (a stray % or a truncated %A, say).",
    });
  }
}

/** `+` means space in form-encoded bodies, and nowhere else in a URL. */
export function decodeForm(input: string): string {
  return decodeUrl(input.replace(/\+/g, "%20"), false);
}
