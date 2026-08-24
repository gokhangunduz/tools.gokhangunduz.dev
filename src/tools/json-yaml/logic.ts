import type { Localized } from "@/i18n";
import { parseJson } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * JSON and YAML, both directions.
 *
 * The schema is YAML 1.2's JSON schema widened by exactly three things people
 * write in real config files: the core schema's nulls (`~`, `Null`, an empty
 * value), its floats (`.5`) and the `<<` merge key. What it leaves out matters
 * more: YAML 1.1 turns `no`, `off`, `y` and `22:30` into booleans and
 * sexagesimal numbers, which is the Norway problem and the most common way a
 * config file means something other than what it says. Those stay strings.
 */
export type YamlResult = { text: string; documents: number };

type Yaml = typeof import("js-yaml");

function schema(yaml: Yaml) {
  return yaml.JSON_SCHEMA.withTags(
    yaml.nullCoreTag,
    yaml.floatCoreTag,
    yaml.mergeTag,
  );
}

export async function yamlToJson(
  input: string,
  indent: number,
): Promise<YamlResult> {
  if (!input.trim()) return { text: "", documents: 0 };

  const yaml = await import("js-yaml");
  let documents: unknown[];
  try {
    documents = yaml.loadAll(input, null, { schema: schema(yaml) });
  } catch (cause) {
    throw yamlError(cause);
  }

  const value = documents.length === 1 ? documents[0] : documents;
  return {
    text: JSON.stringify(value ?? null, null, indent),
    documents: documents.length,
  };
}

export async function jsonToYaml(
  input: string,
  indent: number,
): Promise<string> {
  if (!input.trim()) return "";

  let value: unknown;
  try {
    value = parseJson(input);
  } catch (cause) {
    throw (await looksLikeYaml(input)) ? NOT_JSON : cause;
  }

  const yaml = await import("js-yaml");
  return yaml.dump(value, {
    indent: indent || 2,
    flowLevel: indent === 0 ? 0 : -1,
    lineWidth: -1,
    noRefs: true,
  });
}

export const NOT_JSON = new ToolError(
  {
    tr: "Bu JSON değil ama YAML gibi görünüyor.",
    en: "This is not JSON but it looks like YAML.",
  },
  {
    action: {
      label: { tr: "YAML → JSON'a geç", en: "Switch to YAML → JSON" },
      direction: "yaml-to-json",
    },
  },
);

async function looksLikeYaml(input: string): Promise<boolean> {
  if (/^\s*[[{"]/.test(input)) return false;
  const yaml = await import("js-yaml");
  try {
    const value = yaml.load(input, { schema: schema(yaml) });
    return value !== null && typeof value === "object";
  } catch {
    return false;
  }
}

const REASONS: [RegExp, Localized][] = [
  [
    /tab characters/,
    {
      tr: "girintide tab kullanılamaz",
      en: "tabs cannot be used for indentation",
    },
  ],
  [/indentation/, { tr: "girinti hatalı", en: "bad indentation" }],
  [
    /duplicat\w* mapping key/,
    { tr: "aynı key iki kez yazılmış", en: "a key appears twice" },
  ],
  [
    /unexpected end/,
    {
      tr: "YAML yarıda bitiyor; kapanmamış bir tırnak ya da parantez var",
      en: "the YAML ends too early; a quote or bracket is not closed",
    },
  ],
  [
    /missed comma/,
    { tr: "iki eleman arasında virgül eksik", en: "a comma is missing" },
  ],
  [
    /alias/,
    { tr: "tanımsız ya da hatalı alias", en: "an undefined or broken alias" },
  ],
  [
    /key-value separator|block mapping entry/,
    {
      tr: "key'den sonra ': ' bekleniyordu",
      en: "expected ': ' after the key",
    },
  ],
  [
    /end of the stream or a document separator/,
    {
      tr: "beklenmeyen içerik; girintiyi ya da eksik ':' işaretini kontrol et",
      en: "unexpected content; check the indentation or a missing ':'",
    },
  ],
];

function yamlError(cause: unknown): ToolError {
  const reason =
    cause && typeof cause === "object" && "reason" in cause
      ? String(cause.reason)
      : "";
  const mark =
    cause && typeof cause === "object" && "mark" in cause
      ? (cause.mark as { line?: number; column?: number } | null)
      : null;
  const message = REASONS.find(([pattern]) => pattern.test(reason))?.[1] ?? {
    tr: "sözdizimi hatası",
    en: "syntax error",
  };
  return new ToolError(
    {
      tr: `YAML parse edilemedi: ${message.tr}`,
      en: `Could not parse the YAML: ${message.en}`,
    },
    typeof mark?.line === "number"
      ? { at: { line: mark.line + 1, column: (mark.column ?? 0) + 1 } }
      : {},
  );
}

const COERCION: Localized = {
  tr: "~, null ve boş değer null olur, .5 sayı olur; yes/no/on/off ve 22:30 metin kalır.",
  en: "~, null and empty values become null, .5 a number; yes/no/on/off and 22:30 stay strings.",
};

export function yamlNote(documents: number): Localized {
  if (documents < 2) return COERCION;
  return {
    tr: `${documents} doküman → dizi olarak verildi`,
    en: `${documents} documents → given as an array`,
  };
}
