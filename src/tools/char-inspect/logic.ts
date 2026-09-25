/**
 * Every character in a string, named.
 *
 * The question this answers is "what exactly is in this value" — the one
 * that comes up when a comparison fails and both sides look identical.
 * Non-breaking spaces, soft hyphens, look-alike Cyrillic letters and
 * combining marks all render as something ordinary and none of them are.
 */
export type Entry = {
  index: number;
  character: string;
  codePoint: number;
  name: string;
  utf8: string;
  suspicious: boolean;
};

const NAMED: Record<number, string> = {
  0x09: "TAB",
  0x0a: "LINE FEED",
  0x0d: "CARRIAGE RETURN",
  0x20: "SPACE",
  0xa0: "NO-BREAK SPACE",
  0xad: "SOFT HYPHEN",
  0x200b: "ZERO WIDTH SPACE",
  0x200c: "ZERO WIDTH NON-JOINER",
  0x200d: "ZERO WIDTH JOINER",
  0x200e: "LEFT-TO-RIGHT MARK",
  0x200f: "RIGHT-TO-LEFT MARK",
  0x2018: "LEFT SINGLE QUOTATION MARK",
  0x2019: "RIGHT SINGLE QUOTATION MARK",
  0x201c: "LEFT DOUBLE QUOTATION MARK",
  0x201d: "RIGHT DOUBLE QUOTATION MARK",
  0x2013: "EN DASH",
  0x2014: "EM DASH",
  0x2026: "HORIZONTAL ELLIPSIS",
  0x202f: "NARROW NO-BREAK SPACE",
  0x2060: "WORD JOINER",
  0xfeff: "ZERO WIDTH NO-BREAK SPACE (BOM)",
};

/** Characters that look like something else, or like nothing at all. */
const SUSPICIOUS = new Set([
  0xa0, 0xad, 0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x202f, 0x2060, 0xfeff,
  0x2018, 0x2019, 0x201c, 0x201d,
]);

export function inspect(input: string): Entry[] {
  return [...input].map((character, index) => {
    const codePoint = character.codePointAt(0)!;
    return {
      index,
      character,
      codePoint,
      name: describe(codePoint),
      utf8: Array.from(new TextEncoder().encode(character), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join(" "),
      suspicious: SUSPICIOUS.has(codePoint) || isCyrillicLookalike(codePoint),
    };
  });
}

function describe(codePoint: number): string {
  if (NAMED[codePoint]) return NAMED[codePoint];
  if (codePoint < 0x20) return `CONTROL U+${hex(codePoint)}`;
  if (codePoint >= 0x0300 && codePoint <= 0x036f) return "COMBINING MARK";
  if (codePoint >= 0x0400 && codePoint <= 0x04ff) return "CYRILLIC";
  if (codePoint >= 0x0370 && codePoint <= 0x03ff) return "GREEK";
  if (codePoint >= 0x1f300) return "EMOJI / SYMBOL";
  return "";
}

/** The Cyrillic letters that are visually identical to Latin ones. */
function isCyrillicLookalike(codePoint: number): boolean {
  return [
    0x0430, 0x0435, 0x043e, 0x0440, 0x0441, 0x0445, 0x0443, 0x0410, 0x0415,
    0x041e, 0x0420, 0x0421, 0x0425,
  ].includes(codePoint);
}

export function format(input: string, locale: string): string {
  if (!input) return "";

  const entries = inspect(input);
  const lines = entries.map((entry) => {
    const shown =
      entry.codePoint < 0x20 || entry.suspicious ? "\u00b7" : entry.character;
    const flag = entry.suspicious ? " \u26a0" : "";
    return `${String(entry.index).padStart(4)}  ${shown}  U+${hex(entry.codePoint).padEnd(6)}  ${entry.utf8.padEnd(11)}  ${entry.name}${flag}`;
  });

  const odd = entries.filter((entry) => entry.suspicious).length;
  const warning =
    odd > 0
      ? locale === "tr"
        ? `\n\n\u26a0 ${odd} \u015f\u00fcpheli karakter: g\u00f6r\u00fcnmez ya da ba\u015fka bir harfe benziyor.`
        : `\n\n\u26a0 ${odd} suspicious character${odd === 1 ? "" : "s"}: invisible, or a look-alike.`
      : "";

  return lines.join("\n") + warning;
}

function hex(codePoint: number): string {
  return codePoint.toString(16).toUpperCase().padStart(4, "0");
}
