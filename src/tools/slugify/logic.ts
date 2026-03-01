/**
 * A URL slug from a title.
 *
 * Turkish letters are transliterated rather than stripped: NFD normalisation
 * turns "ü" into "u" plus a combining mark, which the ASCII filter then
 * removes correctly — but "ı" and "ş" have no decomposition, so they would
 * vanish and "Işık" would become "ik". The explicit map is what keeps a
 * Turkish title readable as a slug.
 */
const TURKISH: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  I: "I",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

export type Options = {
  separator: string;
  lower: boolean;
  strict: boolean;
};

export function slugify(input: string, options: Options): string {
  if (!input.trim()) return "";

  let value = input.trim();
  value = value.replace(
    /[çÇğĞıIİöÖşŞüÜ]/g,
    (character) => TURKISH[character] ?? character,
  );
  // Everything else that decomposes: é → e, ñ → n.
  value = value.normalize("NFD").replace(/[̀-ͯ]/g, "");

  if (options.lower) value = value.toLowerCase();

  value = options.strict
    ? value.replace(/[^A-Za-z0-9]+/g, options.separator)
    : value.replace(/[^A-Za-z0-9._~-]+/g, options.separator);

  const escaped = options.separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return value
    .replace(new RegExp(`${escaped}{2,}`, "g"), options.separator)
    .replace(new RegExp(`^${escaped}|${escaped}$`, "g"), "");
}
