import { ToolError } from "../text-tool";

/**
 * Passwords and passphrases, with the entropy printed next to them.
 *
 * The number is the point: "16 characters" says nothing, "94 bits" says how
 * long an offline attack takes. It is computed from the alphabet actually in
 * use — excluding the ambiguous characters shrinks the alphabet, and the
 * figure has to drop with it rather than flattering the result.
 */
const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};

const AMBIGUOUS = /[Il1O0]/g;

export type Options = {
  length: number;
  count: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
};

export function buildAlphabet(options: Options): string {
  let alphabet = "";
  if (options.lower) alphabet += SETS.lower;
  if (options.upper) alphabet += SETS.upper;
  if (options.digits) alphabet += SETS.digits;
  if (options.symbols) alphabet += SETS.symbols;
  if (options.avoidAmbiguous) alphabet = alphabet.replace(AMBIGUOUS, "");
  return alphabet;
}

export function generatePasswords(options: Options): string {
  const alphabet = buildAlphabet(options);
  if (alphabet.length === 0) {
    throw new ToolError({
      tr: "En az bir karakter kümesi seçili olmalı.",
      en: "At least one character set must be selected.",
    });
  }
  if (options.length < 4 || options.length > 256) {
    throw new ToolError({
      tr: "Uzunluk 4 ile 256 arasında olmalı.",
      en: "The length must be between 4 and 256.",
    });
  }

  return Array.from({ length: options.count }, () =>
    one(alphabet, options.length),
  ).join("\n");
}

/**
 * Rejection sampling, so every character is equally likely.
 *
 * `% alphabet.length` on a random byte biases the first few characters of the
 * alphabet, which is a real weakness and an easy one to leave in.
 */
function one(alphabet: string, length: number): string {
  const limit = 256 - (256 % alphabet.length);
  let output = "";
  while (output.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    for (const byte of bytes) {
      if (byte >= limit) continue;
      output += alphabet[byte % alphabet.length];
      if (output.length === length) break;
    }
  }
  return output;
}

export function entropyBits(options: Options): number {
  const alphabet = buildAlphabet(options);
  if (alphabet.length === 0) return 0;
  return Math.round(options.length * Math.log2(alphabet.length));
}

/** What that number means, in the only terms that matter. */
export function crackTime(bits: number, locale: string): string {
  // 1e11 guesses a second: a mid-range GPU rig against a fast hash.
  const seconds = 2 ** (bits - 1) / 1e11;
  const units: [number, string, string][] = [
    [1, "saniye", "seconds"],
    [60, "dakika", "minutes"],
    [3600, "saat", "hours"],
    [86_400, "gün", "days"],
    [31_536_000, "yıl", "years"],
  ];

  let chosen = units[0];
  for (const unit of units) if (seconds >= unit[0]) chosen = unit;

  const amount = seconds / chosen[0];
  const label = locale === "tr" ? chosen[1] : chosen[2];
  if (amount > 1e6) {
    return `${amount.toExponential(1)} ${label}`;
  }
  return `${amount < 10 ? amount.toFixed(1) : Math.round(amount)} ${label}`;
}
