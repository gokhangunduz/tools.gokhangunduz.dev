import type { Localized } from "@/i18n";
import { ToolError, type Tone } from "../text-tool";

/**
 * Passwords with the entropy printed next to them.
 *
 * The number is the point: "16 characters" says nothing, "94 bits" says how
 * long an offline attack takes. It is computed from the alphabet actually in
 * use — excluding the ambiguous characters shrinks the alphabet, and the
 * figure has to drop with it rather than flattering the result.
 */
export const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};

export const SAFE_SYMBOLS = "-_.~";

const AMBIGUOUS = /[Il1O0]/g;

export type Options = {
  length: number;
  count: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
  /** The symbol set in use; defaults to `SETS.symbols`. */
  symbolSet?: string;
};

/** Each enabled set on its own, after the symbol set and the ambiguity filter. */
export function enabledSets(options: Options): string[] {
  const symbols = [
    ...new Set((options.symbolSet ?? SETS.symbols).replace(/\s/g, "")),
  ].join("");
  const sets = [
    options.lower && SETS.lower,
    options.upper && SETS.upper,
    options.digits && SETS.digits,
    options.symbols && symbols,
  ]
    .filter((set): set is string => Boolean(set))
    .map((set) => (options.avoidAmbiguous ? set.replace(AMBIGUOUS, "") : set))
    .filter((set) => set.length > 0);
  return sets;
}

export function buildAlphabet(options: Options): string {
  return [...new Set(enabledSets(options).join(""))].join("");
}

export function generatePasswords(options: Options): string {
  const sets = enabledSets(options);
  const alphabet = buildAlphabet(options);
  if (alphabet.length === 0) {
    throw new ToolError({
      tr: "En az bir karakter kümesi seçili olmalı.",
      en: "At least one character set must be selected.",
    });
  }
  if (
    !Number.isInteger(options.length) ||
    options.length < 4 ||
    options.length > 256
  ) {
    throw new ToolError(
      {
        tr: "Uzunluk 4 ile 256 arasında olmalı.",
        en: "The length must be between 4 and 256.",
      },
      { field: "length" },
    );
  }
  if (options.length < sets.length) {
    throw new ToolError(
      {
        tr: `Seçili ${sets.length} kümenin her birinden bir karakter için uzunluk en az ${sets.length} olmalı.`,
        en: `The length must be at least ${sets.length} to hold one character from each selected set.`,
      },
      { field: "length" },
    );
  }

  return Array.from({ length: options.count }, () =>
    one(sets, alphabet, options.length),
  ).join("\n");
}

/**
 * One character from every enabled set, the rest from the whole alphabet,
 * then a Fisher–Yates shuffle so the guaranteed ones are not always first.
 */
function one(sets: string[], alphabet: string, length: number): string {
  const characters = sets.map((set) => set[randomIndex(set.length)]);
  while (characters.length < length) {
    characters.push(alphabet[randomIndex(alphabet.length)]);
  }
  for (let i = characters.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }
  return characters.join("");
}

const pool = new Uint32Array(256);
let poolIndex = pool.length;

/**
 * Rejection sampling over 32-bit values, so every index is equally likely;
 * `% n` on a raw random value biases the low indexes.
 */
export function randomIndex(n: number): number {
  const limit = 2 ** 32 - (2 ** 32 % n);
  for (;;) {
    if (poolIndex === pool.length) {
      crypto.getRandomValues(pool);
      poolIndex = 0;
    }
    const value = pool[poolIndex++];
    if (value < limit) return value % n;
  }
}

export function entropyBits(options: Options): number {
  const alphabet = buildAlphabet(options);
  if (alphabet.length === 0) return 0;
  return Math.round(options.length * Math.log2(alphabet.length));
}

const YEAR = 31_536_000;
const UNIVERSE_YEARS = 1.38e10;

/** What that number means, in the only terms that matter. */
export function crackTime(bits: number, locale: string): string {
  const tr = locale === "tr";
  // 1e11 guesses a second: a mid-range GPU rig against a fast hash.
  const seconds = 2 ** (bits - 1) / 1e11;
  const years = seconds / YEAR;
  if (years > UNIVERSE_YEARS) {
    return tr ? "evrenin yaşından uzun" : "longer than the age of the universe";
  }
  if (years > 1e9) return tr ? "milyarlarca yıl" : "billions of years";
  if (years > 1e6) return tr ? "milyonlarca yıl" : "millions of years";

  const units: [number, string, string][] = [
    [1, "saniye", "seconds"],
    [60, "dakika", "minutes"],
    [3600, "saat", "hours"],
    [86_400, "gün", "days"],
    [YEAR, "yıl", "years"],
  ];
  let chosen = units[0];
  for (const unit of units) if (seconds >= unit[0]) chosen = unit;

  const amount = seconds / chosen[0];
  const label = tr ? chosen[1] : chosen[2];
  if (amount < 1) return tr ? "bir saniyeden kısa" : "under a second";
  const shown =
    amount < 10
      ? amount.toLocaleString(tr ? "tr" : "en", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : Math.round(amount).toLocaleString(tr ? "tr" : "en");
  return `~${shown} ${label}`;
}

export function strength(bits: number): { text: Localized; tone: Tone } {
  if (bits < 50)
    return { text: { tr: "Zayıf", en: "Weak" }, tone: "destructive" };
  if (bits < 80) return { text: { tr: "Orta", en: "Fair" }, tone: "muted" };
  if (bits < 120)
    return { text: { tr: "Güçlü", en: "Strong" }, tone: "success" };
  return { text: { tr: "Çok güçlü", en: "Very strong" }, tone: "success" };
}
