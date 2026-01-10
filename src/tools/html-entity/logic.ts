/**
 * HTML entities, encoded and decoded without a DOM.
 *
 * Decoding through `innerHTML` is the usual trick and is also how XSS gets
 * into a page: it runs the markup. This works on the text, which means it can
 * be unit-tested and cannot execute anything.
 *
 * The named set is the one that actually appears in hand-written markup and in
 * output from editors and scrapers. Anything outside it is handled by the
 * numeric forms, which cover every character there is.
 */
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  deg: "°",
  plusmn: "±",
  times: "×",
  divide: "÷",
  frac12: "½",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  sect: "§",
  para: "¶",
  bull: "•",
  dagger: "†",
  middot: "·",
  larr: "←",
  rarr: "→",
  uarr: "↑",
  darr: "↓",
  harr: "↔",
  ne: "≠",
  le: "≤",
  ge: "≥",
  infin: "∞",
  shy: "­",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  zwnj: "‌",
  zwj: "‍",
};

const BY_CHARACTER = new Map(
  Object.entries(NAMED).map(([name, character]) => [character, `&${name};`]),
);

/**
 * The five that must always be escaped, and optionally everything non-ASCII.
 *
 * `'` is escaped as `&#39;` rather than `&apos;`: the named form is XML, and
 * older HTML parsers leave it as literal text.
 */
export function encodeEntities(input: string, allNonAscii: boolean): string {
  let output = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  if (allNonAscii) {
    // Iterating by code point, so an emoji becomes one entity rather than two
    // broken halves of a surrogate pair.
    output = [...output]
      .map((character) => {
        const code = character.codePointAt(0)!;
        if (code < 128) return character;
        return BY_CHARACTER.get(character) ?? `&#${code};`;
      })
      .join("");
  }

  return output;
}

export function decodeEntities(input: string): string {
  return input.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi,
    (match, body: string) => {
      const lower = body.toLowerCase();
      if (lower.startsWith("#x"))
        return fromCode(parseInt(body.slice(2), 16), match);
      if (lower.startsWith("#"))
        return fromCode(parseInt(body.slice(1), 10), match);
      return NAMED[lower] ?? match;
    },
  );
}

/** An out-of-range or malformed reference is left as written rather than dropped. */
function fromCode(code: number, original: string): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return original;
  try {
    return String.fromCodePoint(code);
  } catch {
    return original;
  }
}
