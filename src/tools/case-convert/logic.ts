/**
 * The naming conventions, with Turkish casing done properly.
 *
 * `"I".toLowerCase()` is "i" in every locale except Turkish, where it is "ı" —
 * and `"i".toUpperCase()` is "İ". A converter that ignores that turns "IŞIK"
 * into "isik" and "İstanbul" into "istanbul", which is the difference between
 * a slug that reads and one that does not. Every case change here names the
 * locale, and the Turkish rules are the default because this is a Turkish
 * site; the English rules stay available for identifiers, where "I" must stay
 * "i" or the code does not compile.
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

export function convertCase(
  input: string,
  style: Style,
  turkish: boolean,
): string {
  if (!input) return "";
  const locale = turkish ? "tr" : "en";

  if (style === "upper") return input.toLocaleUpperCase(locale);
  if (style === "lower") return input.toLocaleLowerCase(locale);

  // Sentences and titles are per line, so a paragraph keeps its shape.
  if (style === "sentence" || style === "title") {
    return input
      .split("\n")
      .map((line) =>
        style === "sentence"
          ? sentenceCase(line, locale)
          : titleCase(line, locale),
      )
      .join("\n");
  }

  const words = splitWords(input);
  if (words.length === 0) return "";

  switch (style) {
    case "camel":
      return words
        .map((word, index) =>
          index === 0
            ? word.toLocaleLowerCase(locale)
            : capitalize(word, locale),
        )
        .join("");
    case "pascal":
      return words.map((word) => capitalize(word, locale)).join("");
    case "snake":
      return words.map((word) => word.toLocaleLowerCase(locale)).join("_");
    case "kebab":
      return words.map((word) => word.toLocaleLowerCase(locale)).join("-");
    case "constant":
      return words.map((word) => word.toLocaleUpperCase(locale)).join("_");
  }
}

/** Splits on separators and on the camelCase humps. */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-zçğıöşü0-9])([A-ZÇĞİÖŞÜ])/g, "$1 $2")
    .split(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]+/)
    .filter(Boolean);
}

function capitalize(word: string, locale: string): string {
  return (
    word.slice(0, 1).toLocaleUpperCase(locale) +
    word.slice(1).toLocaleLowerCase(locale)
  );
}

function sentenceCase(line: string, locale: string): string {
  const lower = line.toLocaleLowerCase(locale);
  return lower.replace(
    /^(\s*)(\p{L})/u,
    (_, space: string, letter: string) =>
      space + letter.toLocaleUpperCase(locale),
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
  return line
    .toLocaleLowerCase(locale)
    .split(/(\s+)/)
    .map((part, index) => {
      if (!part.trim()) return part;
      if (index > 0 && MINOR.has(part)) return part;
      return capitalize(part, locale);
    })
    .join("");
}
