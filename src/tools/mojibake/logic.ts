import { ToolError } from "../text-tool";

/**
 * Repairs text that was decoded with the wrong encoding.
 *
 * "\u00c5\u0178" instead of "\u015f" is UTF-8 bytes read as Windows-1252, and
 * "\u00c3\u00bc" instead of "\u00fc" is the same accident. The repair is to undo the
 * wrong decode: take the characters back to the bytes that produced them and
 * decode those as UTF-8 instead.
 *
 * Text that has genuinely lost its Turkish letters — passed through a
 * Latin-1 pipeline that had nowhere to put \u015f, \u011f and \u0131 — cannot be repaired
 * by any decoding, so that case is refused rather than half-fixed.
 */
export const LEGACY_ENCODINGS = [
  "windows-1252",
  "iso-8859-9",
  "windows-1254",
  "iso-8859-1",
] as const;

export type LegacyEncoding = (typeof LEGACY_ENCODINGS)[number];

export function repair(input: string, encoding: LegacyEncoding): string {
  if (!input) return "";

  // Every character has to exist in the legacy encoding, or the text was
  // never produced by this kind of mistake.
  const bytes = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const byte = toByte(input.charCodeAt(i), encoding);
    if (byte === null) {
      throw new ToolError({
        tr: `"${input[i]}" bu t\u00fcr bir bozulmadan gelmi\u015f olamaz \u2014 metin zaten do\u011fru olabilir.`,
        en: `"${input[i]}" cannot come from this kind of corruption \u2014 the text may already be correct.`,
      });
    }
    bytes[i] = byte;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ToolError({
      tr: "Baytlar ge\u00e7erli UTF-8 vermiyor; kaynak kodlama farkl\u0131 olabilir.",
      en: "Those bytes are not valid UTF-8; the source encoding may be different.",
    });
  }
}

/** The Windows-1252 positions that differ from Latin-1, as a code-point map. */
const CP1252: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

/** ISO-8859-9 is Latin-1 with six Turkish letters in place of Icelandic ones. */
const TURKISH_8859_9: Record<number, number> = {
  0x011e: 0xd0,
  0x0130: 0xdd,
  0x015e: 0xde,
  0x011f: 0xf0,
  0x0131: 0xfd,
  0x015f: 0xfe,
};

const TURKISH_POSITIONS = [0xd0, 0xdd, 0xde, 0xf0, 0xfd, 0xfe];

function toByte(code: number, encoding: LegacyEncoding): number | null {
  const turkish = encoding === "iso-8859-9" || encoding === "windows-1254";

  if (code <= 0xff) {
    // In 8859-9 these six positions hold Turkish letters, so the Latin-1
    // character that lives there could not have been the byte.
    if (turkish && TURKISH_POSITIONS.includes(code)) return null;
    return code;
  }
  if (turkish && code in TURKISH_8859_9) return TURKISH_8859_9[code];
  if (
    (encoding === "windows-1252" || encoding === "windows-1254") &&
    code in CP1252
  ) {
    return CP1252[code];
  }
  return null;
}

/** The signature of this damage, so the tool can confirm what it is looking at. */
export function looksMangled(input: string): boolean {
  return /[\u00c3\u00c5\u00c4\u00ce][\u0080-\u00ff\u0152-\u0178\u2013-\u2122]/.test(
    input,
  );
}
