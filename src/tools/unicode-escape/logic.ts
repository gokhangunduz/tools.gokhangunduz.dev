/**
 * JavaScript string escapes, both ways.
 *
 * The interesting case is anything outside the BMP: an emoji is two UTF-16
 * code units, so `\uXXXX` has to emit both halves of the surrogate pair, while
 * `\u{...}` writes the code point once. Getting that wrong produces a string
 * that looks right in the box and breaks when it is pasted into code.
 */
export type EscapeStyle = "u" | "codepoint";

export function escapeUnicode(
  input: string,
  style: EscapeStyle,
  asciiToo: boolean,
): string {
  if (style === "codepoint") {
    return [...input]
      .map((character) => {
        const code = character.codePointAt(0)!;
        if (!asciiToo && code < 128) return character;
        return `\\u{${code.toString(16)}}`;
      })
      .join("");
  }

  // Per code unit, which is what `\u` means.
  let output = "";
  for (const unit of input) {
    for (let i = 0; i < unit.length; i += 1) {
      const code = unit.charCodeAt(i);
      if (!asciiToo && code < 128) {
        output += unit[i];
      } else {
        output += `\\u${code.toString(16).padStart(4, "0")}`;
      }
    }
  }
  return output;
}

export function unescapeUnicode(input: string): string {
  return input
    .replace(/\\u\{([0-9a-f]+)\}/gi, (match, hex: string) => {
      const code = parseInt(hex, 16);
      return code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/\\u([0-9a-f]{4})/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/\\x([0-9a-f]{2})/gi, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}
