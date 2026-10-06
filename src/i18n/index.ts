import tr from "./tr.json" with { type: "json" };
import en from "./en.json" with { type: "json" };

export const LOCALES = ["en", "tr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

type Messages = typeof tr;

const dictionaries: Record<Locale, Messages> = { tr, en };

type Leaf<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaf<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaf<Messages>;

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

  return typeof node === "string" ? node : key;
}

export function t(locale: Locale, key: MessageKey, vars?: Vars): string {
  const raw = lookup(locale, key);
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export type Localized = Record<Locale, string>;

export function pick(locale: Locale, value: Localized): string {
  return value[locale];
}
