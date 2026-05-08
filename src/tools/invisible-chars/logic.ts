import type { Localized } from "@/i18n";

/**
 * Finds and removes the characters that are not visible but are there.
 *
 * Text copied out of a PDF, a chat client or a website arrives with
 * non-breaking spaces where spaces belong, zero-width joiners in the middle of
 * words and a byte-order mark at the front. They break string comparisons,
 * they break `JSON.parse` on the first character, and none of them can be
 * seen — which is why finding them is a tool and not a look.
 */
type Rule = {
  pattern: RegExp;
  label: Localized;
  /** What it becomes when cleaned; empty means removed. */
  replacement: string;
};

const RULES: Rule[] = [
  {
    pattern: /\ufeff/g,
    label: { tr: "BOM (U+FEFF)", en: "BOM (U+FEFF)" },
    replacement: "",
  },
  {
    pattern: /[\u200b\u200c\u200d\u2060]/g,
    label: {
      tr: "s\u0131f\u0131r geni\u015flikli karakter",
      en: "zero-width character",
    },
    replacement: "",
  },
  {
    pattern: /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,
    label: { tr: "y\u00f6n i\u015fareti", en: "directional mark" },
    replacement: "",
  },
  {
    pattern: /\u00ad/g,
    label: { tr: "yumu\u015fak tire", en: "soft hyphen" },
    replacement: "",
  },
  {
    pattern: /[\u00a0\u202f\u2007]/g,
    label: { tr: "b\u00f6l\u00fcnmez bo\u015fluk", en: "no-break space" },
    replacement: " ",
  },
  {
    pattern: /[\u2018\u2019]/g,
    label: { tr: "e\u011fik tek t\u0131rnak", en: "curly single quote" },
    replacement: "'",
  },
  {
    pattern: /[\u201c\u201d]/g,
    label: { tr: "e\u011fik \u00e7ift t\u0131rnak", en: "curly double quote" },
    replacement: '"',
  },
  {
    pattern: /[\u2013\u2014]/g,
    label: { tr: "uzun tire", en: "en/em dash" },
    replacement: "-",
  },
  {
    pattern: /\u2026/g,
    label: { tr: "\u00fc\u00e7 nokta karakteri", en: "ellipsis character" },
    replacement: "...",
  },
];

export function clean(input: string, keepPunctuation: boolean): string {
  if (!input) return "";
  let output = input;
  for (const rule of RULES) {
    // The punctuation rules are the ones with a visible replacement; someone
    // cleaning prose wants to keep their typographic quotes.
    if (
      keepPunctuation &&
      rule.replacement !== "" &&
      rule.replacement !== " "
    ) {
      continue;
    }
    output = output.replace(rule.pattern, rule.replacement);
  }
  return output;
}

export function findAll(input: string, locale: "tr" | "en"): string {
  if (!input) return "";

  const found = RULES.map((rule) => {
    const matches = input.match(rule.pattern);
    return { label: rule.label[locale], count: matches?.length ?? 0 };
  }).filter((entry) => entry.count > 0);

  if (found.length === 0) {
    return locale === "tr"
      ? "Gizli ya da bi\u00e7imsel karakter bulunamad\u0131."
      : "No hidden or typographic characters found.";
  }

  const width = Math.max(...found.map((entry) => entry.label.length));
  return found
    .map((entry) => `${entry.label.padEnd(width)}  ${entry.count}`)
    .join("\n");
}
