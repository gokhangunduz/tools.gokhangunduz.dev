import type { Localized } from "@/i18n";
import { positionAt, ToolError } from "@/tools/text-tool";

/**
 * One JSON parser for every tool that takes JSON.
 *
 * `JSON.parse` does the parsing. Its message differs per browser and some
 * carry no position at all, so when it fails the input is scanned again here
 * to find where and why, in both languages.
 */
export function parseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    const problem = locateJsonError(input);
    if (!problem)
      throw new ToolError({ tr: "Geçersiz JSON.", en: "Invalid JSON." });
    throw new ToolError(
      {
        tr: `Geçersiz JSON: ${problem.message.tr}`,
        en: `Invalid JSON: ${problem.message.en}`,
      },
      { at: positionAt(input, problem.offset) },
    );
  }
}

/** Rejects a top-level array or scalar where a tool needs an object. */
export function parseJsonObject(input: string): Record<string, unknown> {
  const value = parseJson(input);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ToolError({
      tr: "Girdi bir JSON nesnesi olmalı ({ ... }).",
      en: "The input must be a JSON object ({ ... }).",
    });
  }
  return value as Record<string, unknown>;
}

export type JsonProblem = { offset: number; message: Localized };

class Stop {
  constructor(
    readonly offset: number,
    readonly message: Localized,
  ) {}
}

const MESSAGES = {
  end: { tr: "JSON yarıda bitiyor", en: "the JSON ends too early" },
  value: { tr: "bir değer bekleniyordu", en: "expected a value" },
  key: {
    tr: "çift tırnaklı bir key bekleniyordu",
    en: "expected a double-quoted key",
  },
  colon: { tr: "key'den sonra : bekleniyordu", en: "expected : after the key" },
  objectNext: {
    tr: "virgül ya da } bekleniyordu",
    en: "expected a comma or }",
  },
  arrayNext: { tr: "virgül ya da ] bekleniyordu", en: "expected a comma or ]" },
  trailingComma: {
    tr: "sondaki virgül JSON'da geçersiz",
    en: "a trailing comma is not allowed in JSON",
  },
  singleQuote: {
    tr: "JSON'da metinler çift tırnak kullanır",
    en: "JSON strings use double quotes",
  },
  comment: {
    tr: "JSON'da yorum satırı olmaz",
    en: "JSON does not allow comments",
  },
  unterminated: { tr: "tırnak kapanmamış", en: "unterminated string" },
  control: {
    tr: "metin içinde kaçışsız kontrol karakteri",
    en: "unescaped control character in a string",
  },
  escape: { tr: "geçersiz kaçış dizisi", en: "invalid escape sequence" },
  number: { tr: "geçersiz sayı", en: "invalid number" },
  extra: {
    tr: "JSON değerinden sonra fazladan içerik var",
    en: "unexpected content after the JSON value",
  },
  empty: { tr: "girdi boş", en: "the input is empty" },
} satisfies Record<string, Localized>;

/**
 * Where and why `input` is not JSON, or null if it is. Only called after
 * `JSON.parse` has failed, so it favours a helpful message over speed.
 */
export function locateJsonError(input: string): JsonProblem | null {
  let i = 0;

  const fail = (message: Localized, at = i): never => {
    throw new Stop(at, message);
  };
  const skip = () => {
    while (i < input.length && " \t\n\r".includes(input[i])) i++;
  };
  const unexpected = (fallback: Localized): never => {
    if (i >= input.length) return fail(MESSAGES.end);
    const c = input[i];
    if (c === "'") return fail(MESSAGES.singleQuote);
    if (c === "/" && (input[i + 1] === "/" || input[i + 1] === "*")) {
      return fail(MESSAGES.comment);
    }
    return fail(fallback);
  };

  const string = () => {
    i++;
    for (;;) {
      if (i >= input.length) fail(MESSAGES.unterminated);
      const c = input[i];
      if (c === '"') {
        i++;
        return;
      }
      if (c < " ") fail(c === "\n" ? MESSAGES.unterminated : MESSAGES.control);
      if (c === "\\") {
        const next = input[i + 1];
        if (next === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(input.slice(i + 2, i + 6))) {
            fail(MESSAGES.escape);
          }
          i += 6;
          continue;
        }
        if (next === undefined || !'"\\/bfnrt'.includes(next)) {
          fail(MESSAGES.escape);
        }
        i += 2;
        continue;
      }
      i++;
    }
  };

  const number = () => {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(
      input.slice(i),
    );
    if (!match || match[0] === "-") fail(MESSAGES.number);
    i += match![0].length;
    if (i < input.length && /[\d.eE+-]/.test(input[i])) fail(MESSAGES.number);
  };

  const value = (): void => {
    skip();
    const c = input[i];
    if (c === "{") return object();
    if (c === "[") return array();
    if (c === '"') return string();
    if (c === "-" || (c >= "0" && c <= "9")) return number();
    for (const word of ["true", "false", "null"]) {
      if (input.startsWith(word, i)) {
        i += word.length;
        return;
      }
    }
    unexpected(MESSAGES.value);
  };

  const object = () => {
    i++;
    skip();
    if (input[i] === "}") {
      i++;
      return;
    }
    for (;;) {
      skip();
      if (input[i] !== '"') unexpected(MESSAGES.key);
      string();
      skip();
      if (input[i] !== ":") unexpected(MESSAGES.colon);
      i++;
      value();
      skip();
      if (input[i] === "}") {
        i++;
        return;
      }
      if (input[i] !== ",") unexpected(MESSAGES.objectNext);
      const comma = i;
      i++;
      skip();
      if (input[i] === "}") fail(MESSAGES.trailingComma, comma);
    }
  };

  const array = () => {
    i++;
    skip();
    if (input[i] === "]") {
      i++;
      return;
    }
    for (;;) {
      value();
      skip();
      if (input[i] === "]") {
        i++;
        return;
      }
      if (input[i] !== ",") unexpected(MESSAGES.arrayNext);
      const comma = i;
      i++;
      skip();
      if (input[i] === "]") fail(MESSAGES.trailingComma, comma);
    }
  };

  try {
    skip();
    if (i >= input.length) fail(MESSAGES.empty);
    value();
    skip();
    if (i < input.length) unexpected(MESSAGES.extra);
    return null;
  } catch (stop) {
    if (stop instanceof Stop)
      return { offset: stop.offset, message: stop.message };
    // Nesting deep enough to exhaust the stack: JSON.parse has already said
    // no, so report it without a position.
    return null;
  }
}
