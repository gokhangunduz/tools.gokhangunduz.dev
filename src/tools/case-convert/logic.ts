const LETTERS: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
  ß: "ss",
  ẞ: "SS",
  æ: "ae",
  Æ: "AE",
  ø: "o",
  Ø: "O",
  ł: "l",
  Ł: "L",
  đ: "d",
  Đ: "D",
  œ: "oe",
  Œ: "OE",
  þ: "th",
  Þ: "TH",
};

const MAPPED = new RegExp(`[${Object.keys(LETTERS).join("")}]`, "g");

/** Latin letters without their accents: "Işık Çağrı" → "Isik Cagri", "Straße" → "Strasse". */
export function transliterate(value: string): string {
  return value
    .replace(MAPPED, (character) => LETTERS[character])
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * The naming conventions, with Turkish casing done properly.
 *
 * `"I".toLowerCase()` is "i" in every locale except Turkish, where it is "ı" —
 * and `"i".toUpperCase()` is "İ". Prose styles (BÜYÜK, küçük, Title,
 * Sentence) follow the Turkish rules by default because this is a Turkish
 * site. Identifier styles always use the English rules: `user_id` has to
 * become `userId`, never `userİd`, or the code does not compile.
 *
 * Every style works line by line, so a pasted list converts as a list.
 */
export type Style =
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "title"
  | "sentence"
  | "upper"
  | "lower";

export const CODE_STYLES: readonly Style[] = [
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant",
];

export function convertCase(
  input: string,
  style: Style,
  turkish: boolean,
  ascii = false,
): string {
  if (!input) return "";
  const locale = turkish ? "tr" : "en";
  const code = CODE_STYLES.includes(style);

  return input
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim()) return "";
      if (code) return codeCase(ascii ? transliterate(line) : line, style);
      if (style === "upper") return line.toLocaleUpperCase(locale);
      if (style === "lower") return line.toLocaleLowerCase(locale);
      if (style === "sentence") return sentenceCase(line, locale);
      return titleCase(line, locale);
    })
    .join("\n");
}

function codeCase(line: string, style: Style): string {
  const words = splitWords(line);
  switch (style) {
    case "camel":
      return words
        .map((word, index) => (index === 0 ? lower(word) : capitalize(word)))
        .join("");
    case "pascal":
      return words.map(capitalize).join("");
    case "snake":
      return words.map(lower).join("_");
    case "kebab":
      return words.map(lower).join("-");
    default:
      return words.map((word) => word.toLocaleUpperCase("en")).join("_");
  }
}

// English lowercasing turns "İ" into "i" plus a combining dot; plain "i" is what an identifier wants.
function lower(word: string): string {
  return word.replace(/İ/g, "i").toLocaleLowerCase("en");
}

function capitalize(word: string): string {
  return word.slice(0, 1).toLocaleUpperCase("en") + lower(word.slice(1));
}

/** Splits on separators and on the humps: "getHTTPResponse" → get, HTTP, Response. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2")
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);
}

/** An acronym such as API or JSON, which a title or a sentence keeps as written. */
function isAcronym(word: string): boolean {
  const letters = word.replace(/[^\p{L}]/gu, "");
  return letters.length >= 2 && !/\p{Ll}/u.test(letters);
}

/** A line that is all capitals is shouting, not a row of acronyms. */
function keepsAcronyms(line: string): boolean {
  return /\p{Ll}/u.test(line);
}

function sentenceCase(line: string, locale: string): string {
  const keep = keepsAcronyms(line);
  const lowered = line
    .split(/(\s+)/)
    .map((part) =>
      keep && isAcronym(part) ? part : part.toLocaleLowerCase(locale),
    )
    .join("");
  return lowered.replace(
    /^(\P{L}*)(\p{L})/u,
    (_, before: string, letter: string) =>
      before + letter.toLocaleUpperCase(locale),
  );
}

const MINOR = new Set([
  "ve",
  "ile",
  "veya",
  "de",
  "da",
  "ki",
  "bir",
  "and",
  "or",
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
]);

function titleCase(line: string, locale: string): string {
  const keep = keepsAcronyms(line);
  return line
    .split(/(\s+)/)
    .map((part, index) => {
      if (!part.trim()) return part;
      if (keep && isAcronym(part)) return part;
      const word = part.toLocaleLowerCase(locale);
      if (index > 0 && MINOR.has(word)) return word;
      return (
        word.slice(0, 1).toLocaleUpperCase(locale) +
        word.slice(1).toLocaleLowerCase(locale)
      );
    })
    .join("");
}
