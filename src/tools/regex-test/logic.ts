import type { Localized } from "@/i18n";

/**
 * A regular expression against a body of text, with what it matched.
 *
 * Every match is listed with its position and its capture groups, named ones
 * included — the part a "does it match" checkbox leaves out and the part you
 * are usually debugging. Pure and synchronous: the page runs it in a worker,
 * so a pattern that backtracks forever can be killed.
 */
export type Mode = "matches" | "replace" | "split";

export const FLAGS = ["g", "i", "m", "s", "u", "y"] as const;
export type Flag = (typeof FLAGS)[number];

export const MATCH_LIMIT = 5000;

export type RegexRequest = {
  input: string;
  pattern: string;
  flags: string;
  mode: Mode;
  replacement: string;
};

export type RegexMatch = {
  index: number;
  end: number;
  line: number;
  column: number;
  text: string;
  groups: (string | null)[];
  ranges: ([number, number] | null)[];
};

export type RegexOutcome =
  | {
      ok: true;
      count: number;
      matches: RegexMatch[];
      /** One entry per capture group: its name, or null for a numbered one. */
      groupNames: (string | null)[];
      truncated: boolean;
      replaced?: string;
      parts?: string[];
    }
  | { ok: false; error: Localized };

const CAUSES: [RegExp, Localized][] = [
  [
    /unterminated group|missing \)|unclosed group/i,
    { tr: 'bir "(" kapanmamış', en: 'a "(" is never closed' },
  ],
  [
    /unmatched '\)'|unmatched parenthes|unbalanced parenthes/i,
    { tr: 'eşi olmayan bir ")" var', en: 'there is a ")" with no "("' },
  ],
  [
    /nothing to repeat|quantifier.*(nothing|without)/i,
    {
      tr: "*, + ya da ? önünde tekrarlanacak bir şey yok",
      en: "a *, + or ? has nothing to repeat",
    },
  ],
  [
    /unterminated character class|missing \]|unclosed.*class/i,
    { tr: 'bir "[" kapanmamış', en: 'a "[" is never closed' },
  ],
  [
    /duplicate capture group name|duplicate.*group name/i,
    {
      tr: "aynı grup adı iki kez kullanılmış",
      en: "a group name is used twice",
    },
  ],
  [
    /invalid capture group name|invalid group name/i,
    { tr: "grup adı geçersiz", en: "a group name is invalid" },
  ],
  [
    /named (reference|capture referenced)|invalid named/i,
    {
      tr: "\\k<ad> tanımsız bir gruba başvuruyor",
      en: "\\k<name> refers to a group that does not exist",
    },
  ],
  [
    /invalid group|invalid regexp group/i,
    { tr: '"(?" sonrası tanınmadı', en: 'what follows "(?" is not recognised' },
  ],
  [
    /\\ at end of pattern|trailing backslash|escape at end/i,
    { tr: 'desen "\\" ile bitiyor', en: 'the pattern ends with "\\"' },
  ],
  [
    /numbers out of order|out of order in \{\}/i,
    {
      tr: "{} içindeki sayılar ters sırada",
      en: "the numbers in {} are out of order",
    },
  ],
  [
    /range out of order|invalid (character class )?range/i,
    {
      tr: "karakter sınıfında aralık ters (örn. [z-a])",
      en: "a character class range is reversed (e.g. [z-a])",
    },
  ],
  [
    /lone quantifier|incomplete quantifier/i,
    {
      tr: "tek başına bir { ya da } var (u flag'iyle kaçışlanmalı)",
      en: "a lone { or } (escape it under the u flag)",
    },
  ],
  [
    /property name|property escape/i,
    {
      tr: "\\p{…} içindeki Unicode özelliği tanınmadı",
      en: "the Unicode property in \\p{…} is not recognised",
    },
  ],
  [
    /invalid (unicode |class )?escape|invalid escape|invalid decimal escape/i,
    {
      tr: "geçersiz kaçış dizisi (u flag'i daha katıdır)",
      en: "an invalid escape (the u flag is stricter)",
    },
  ],
  [
    /invalid (regular expression )?flags/i,
    { tr: "flag'ler geçersiz", en: "the flags are invalid" },
  ],
];

/** A SyntaxError from any engine as one localized line; unknown causes fall back to the pattern itself. */
export function describeSyntaxError(
  message: string,
  pattern: string,
): Localized {
  const cause = CAUSES.find(([test]) => test.test(message))?.[1];
  if (cause) {
    return {
      tr: `Desen geçersiz: ${cause.tr}.`,
      en: `Invalid pattern: ${cause.en}.`,
    };
  }
  const shown = pattern.length > 40 ? `${pattern.slice(0, 40)}…` : pattern;
  return {
    tr: `Desen geçersiz: /${shown}/`,
    en: `Invalid pattern: /${shown}/`,
  };
}

/** The name of each capture group in order, null for an unnamed one. */
export function captureNames(pattern: string): (string | null)[] {
  const names: (string | null)[] = [];
  let inClass = false;
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === "\\") {
      i += 1;
      continue;
    }
    if (inClass) {
      if (char === "]") inClass = false;
      continue;
    }
    if (char === "[") inClass = true;
    else if (char === "(") {
      if (pattern[i + 1] !== "?") names.push(null);
      else {
        const named = /^\?<([^>=!][^>]*)>/.exec(pattern.slice(i + 1));
        if (named) names.push(named[1]);
      }
    }
  }
  return names;
}

function compile(pattern: string, flags: string): RegExp | Localized {
  try {
    return new RegExp(pattern, flags);
  } catch (cause) {
    return describeSyntaxError(
      cause instanceof Error ? cause.message : String(cause),
      pattern,
    );
  }
}

function unique(flags: string): string {
  return [...new Set(flags)].join("");
}

export function runRegex({
  input,
  pattern,
  flags,
  mode,
  replacement,
}: RegexRequest): RegexOutcome {
  if (!pattern) {
    return {
      ok: false,
      error: { tr: "Desen girilmedi.", en: "No pattern given." },
    };
  }
  const chosen = unique(flags.replace(/[^dgimsuyv]/g, ""));
  const exact = compile(pattern, chosen);
  if (!(exact instanceof RegExp)) return { ok: false, error: exact };
  const scanner = compile(pattern, unique(`${chosen}gd`));
  if (!(scanner instanceof RegExp)) return { ok: false, error: scanner };

  const groupNames = captureNames(pattern);
  const matches: RegexMatch[] = [];
  let count = 0;
  let lineStart = 0;
  let line = 1;
  let scanned = 0;
  for (const match of input.matchAll(scanner)) {
    count += 1;
    if (matches.length >= MATCH_LIMIT) continue;
    const index = match.index ?? 0;
    for (
      let i = input.indexOf("\n", scanned);
      i !== -1 && i < index;
      i = input.indexOf("\n", i + 1)
    ) {
      line += 1;
      lineStart = i + 1;
    }
    scanned = index;
    const indices = (
      match as RegExpMatchArray & { indices?: ([number, number] | undefined)[] }
    ).indices;
    matches.push({
      index,
      end: index + match[0].length,
      line,
      column: index - lineStart + 1,
      text: match[0],
      groups: match.slice(1).map((value) => value ?? null),
      ranges: match.slice(1).map((_, group) => indices?.[group + 1] ?? null),
    });
  }
  while (groupNames.length < (matches[0]?.groups.length ?? 0))
    groupNames.push(null);

  const outcome: RegexOutcome = {
    ok: true,
    count,
    matches,
    groupNames,
    truncated: count > matches.length,
  };
  if (mode === "replace") outcome.replaced = input.replace(exact, replacement);
  if (mode === "split")
    outcome.parts = input.split(exact).map((part) => part ?? "");
  return outcome;
}

/** The text a column copy gives: one value per line. */
export function columnText(matches: RegexMatch[], group: number): string {
  return matches
    .map((match) =>
      group === 0 ? match.text : (match.groups[group - 1] ?? ""),
    )
    .join("\n");
}
