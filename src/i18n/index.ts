import tr from "./tr.json" with { type: "json" };
import en from "./en.json" with { type: "json" };

/**
 * Every string the shell shows, in two files.
 *
 * Tool-specific copy does not live here: a tool's name, blurb and option
 * labels sit in its own `meta.ts` next to its code, so adding a tool is one
 * folder rather than one folder plus edits in two shared JSON files. This
 * layer is the shell — header, footer, the words every tool page repeats.
 *
 * Turkish is the source of truth for the shape: `en.json` is type-checked
 * against it, so a key added to one and forgotten in the other fails to
 * compile rather than rendering as itself in production.
 */
export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

type Messages = typeof tr;

const dictionaries: Record<Locale, Messages> = { tr, en };

/** Dotted paths to the string leaves, so `t()` only accepts a real key. */
type Leaf<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaf<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaf<Messages>;

/** Values substituted into `{name}` placeholders. */
export type Vars = Record<string, string | number>;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

function lookup(locale: Locale, key: string): string {
  let node: unknown = dictionaries[locale];
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  // A missing key returns the key itself: visible on screen, not a crash, and
  // the types above mean it can only happen if the JSON and the build drift.
  return typeof node === "string" ? node : key;
}

export function t(locale: Locale, key: MessageKey, vars?: Vars): string {
  const raw = lookup(locale, key);
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * A string that exists in both languages.
 *
 * Tool metadata uses this instead of a key into the dictionaries above, so a
 * tool carries its own copy and cannot half-exist in one language.
 */
export type Localized = Record<Locale, string>;

export function pick(locale: Locale, value: Localized): string {
  return value[locale];
}
