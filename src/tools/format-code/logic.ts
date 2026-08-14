import type { Options } from "prettier";
import type { Localized } from "@/i18n";
import { ToolError } from "../text-tool";

export const LANGUAGES = [
  "javascript",
  "typescript",
  "json",
  "css",
  "scss",
  "less",
  "html",
  "vue",
  "markdown",
  "yaml",
  "graphql",
] as const;

export type Language = (typeof LANGUAGES)[number];

type Parser = { parser: string; load: () => Promise<unknown[]> };

const PARSERS: Record<Language, Parser> = {
  javascript: {
    parser: "babel",
    load: async () => [
      (await import("prettier/plugins/babel")).default,
      (await import("prettier/plugins/estree")).default,
    ],
  },
  typescript: {
    parser: "typescript",
    load: async () => [
      (await import("prettier/plugins/typescript")).default,
      (await import("prettier/plugins/estree")).default,
    ],
  },
  json: {
    parser: "json",
    // Prettier parses JSON with babel and prints it through the estree printer.
    load: async () => [
      (await import("prettier/plugins/babel")).default,
      (await import("prettier/plugins/estree")).default,
    ],
  },
  css: {
    parser: "css",
    load: async () => [(await import("prettier/plugins/postcss")).default],
  },
  scss: {
    parser: "scss",
    load: async () => [(await import("prettier/plugins/postcss")).default],
  },
  less: {
    parser: "less",
    load: async () => [(await import("prettier/plugins/postcss")).default],
  },
  html: {
    parser: "html",
    load: async () => [(await import("prettier/plugins/html")).default],
  },
  vue: {
    parser: "vue",
    load: async () => [
      (await import("prettier/plugins/html")).default,
      (await import("prettier/plugins/babel")).default,
      (await import("prettier/plugins/estree")).default,
      (await import("prettier/plugins/postcss")).default,
    ],
  },
  markdown: {
    parser: "markdown",
    load: async () => [(await import("prettier/plugins/markdown")).default],
  },
  yaml: {
    parser: "yaml",
    load: async () => [(await import("prettier/plugins/yaml")).default],
  },
  graphql: {
    parser: "graphql",
    load: async () => [(await import("prettier/plugins/graphql")).default],
  },
};

export type TrailingComma = "all" | "es5" | "none";

export type FormatOptions = {
  language: Language;
  width: number;
  tabWidth: number;
  useTabs?: boolean;
  semi: boolean;
  singleQuote: boolean;
  trailingComma?: TrailingComma;
};

export const EXTENSIONS: Record<Language, string> = {
  javascript: "js",
  typescript: "ts",
  json: "json",
  css: "css",
  scss: "scss",
  less: "less",
  html: "html",
  vue: "vue",
  markdown: "md",
  yaml: "yaml",
  graphql: "graphql",
};

export function detectLanguage(input: string): Language {
  const source = input.trim();
  if (/^[[{]/.test(source)) {
    try {
      JSON.parse(source);
      return "json";
    } catch {}
    if (/^\{\s*"/.test(source)) return "json";
  }
  if (source.startsWith("<")) {
    return /<template[\s>]|<script\s+setup\b/.test(source) ? "vue" : "html";
  }
  if (/^---\s*$/m.test(source.split("\n")[0]) || isYaml(source)) return "yaml";
  if (
    /^(?:query|mutation|subscription|fragment)\b[^=;]*\{/.test(source) ||
    /^schema\s*\{/.test(source)
  ) {
    return "graphql";
  }
  if (/^(?:type|input|interface|enum)\s+\w+[^={]*\{/.test(source)) {
    return /;|:\s*(?:string|number|boolean|any|unknown)\b/.test(source)
      ? "typescript"
      : "graphql";
  }
  const code = source.replace(/^(?:\/\*[\s\S]*?\*\/\s*)+/, "");
  if (
    /^(?:@(?:media|import|charset|font-face|keyframes|layer|supports)\b|:root\b)/.test(
      code,
    ) ||
    /^(?!(?:export|declare|abstract|class|interface|namespace|module|enum|type|do|else|try|finally)\b)[^{};=()`'"]+\{\s*[-\w]+\s*:[^;{}]+[;}]/.test(
      code,
    )
  ) {
    return "css";
  }
  if (
    /^#{1,6}\s|^\s*(?:[-*+]|\d+\.)\s+\S|^>\s|^```/m.test(source) &&
    !/[;{}]\s*$/m.test(source)
  ) {
    return "markdown";
  }
  if (
    /:\s*(?:string|number|boolean|any|unknown|void|never)\b|\binterface\s+\w+|\btype\s+\w+\s*=|\bas\s+const\b|\benum\s+\w+|\bimplements\s+\w|\b(?:private|public|protected|readonly)\s+\w+\s*[:;=(]/.test(
      source,
    )
  ) {
    return "typescript";
  }
  return "javascript";
}

function isYaml(source: string): boolean {
  const lines = source
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"));
  if (lines.length === 0 || /[;{}]\s*$/.test(lines[0])) return false;
  return (
    /^[A-Za-z_][\w.-]*:(?:\s|$)/.test(lines[0]) &&
    lines.every((line) =>
      /^\s*(?:[\w."'-]+:(?:\s|$)|-\s|-$|[^:]*$)/.test(line),
    ) &&
    !lines.some((line) => /[;]\s*$|=>|\bfunction\b/.test(line))
  );
}

export async function formatCode(
  input: string,
  options: FormatOptions,
): Promise<string> {
  if (!input.trim()) return "";

  const entry = PARSERS[options.language] ?? PARSERS.javascript;
  const [{ format }, plugins] = await Promise.all([
    import("prettier/standalone"),
    entry.load(),
  ]);

  try {
    return await format(input, {
      parser: entry.parser,
      plugins: plugins as Options["plugins"],
      printWidth: options.width,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs ?? false,
      semi: options.semi,
      singleQuote: options.singleQuote,
      trailingComma: options.trailingComma ?? "all",
    });
  } catch (cause) {
    throw formatError(cause);
  }
}

const REASONS: [RegExp, Localized][] = [
  [/^Unexpected token\b/, { tr: "beklenmeyen token", en: "unexpected token" }],
  [
    /^Unterminated string/,
    { tr: "kapanmamış string", en: "unterminated string" },
  ],
  [
    /^Unterminated template/,
    { tr: "kapanmamış template literal", en: "unterminated template literal" },
  ],
  [
    /^Unterminated comment/,
    { tr: "kapanmamış yorum", en: "unterminated comment" },
  ],
  [
    /^Missing semicolon/,
    { tr: "noktalı virgül eksik", en: "missing semicolon" },
  ],
  [/^Unclosed block/, { tr: "kapanmamış blok", en: "unclosed block" }],
  [/^Unclosed bracket/, { tr: "kapanmamış parantez", en: "unclosed bracket" }],
  [/^Unclosed string/, { tr: "kapanmamış string", en: "unclosed string" }],
  [/^Unknown word/, { tr: "tanınmayan kelime", en: "unknown word" }],
  [
    /^Unexpected closing tag/,
    { tr: "beklenmeyen kapanış etiketi", en: "unexpected closing tag" },
  ],
  [
    /^Unexpected character/,
    { tr: "beklenmeyen karakter", en: "unexpected character" },
  ],
  [/^Syntax Error: Expected/, { tr: "sözdizimi hatası", en: "syntax error" }],
];

export function formatError(cause: unknown): ToolError {
  const { message = "", loc } = (cause ?? {}) as {
    message?: string;
    loc?: { start?: { line?: number; column?: number } };
  };
  const reason = message
    .split("\n")[0]
    .replace(/^\w*SyntaxError:\s*/, "")
    .replace(/\s*\(\d+:\d+\)\s*$/, "")
    .trim();
  const known = REASONS.find(([pattern]) => pattern.test(reason))?.[1];
  const line = loc?.start?.line;
  const column = loc?.start?.column;
  return new ToolError(
    known
      ? {
          tr: `Parse edilemedi: ${known.tr}`,
          en: `Could not parse: ${known.en}`,
        }
      : { tr: "Parse edilemedi", en: "Could not parse" },
    {
      at:
        typeof line === "number" && typeof column === "number"
          ? { line, column: Math.max(column, 1) }
          : undefined,
    },
  );
}

export function changedLines(input: string, output: string): number {
  const split = (text: string) =>
    text.replace(/\r\n?/g, "\n").trimEnd().split("\n");
  const remaining = new Map<string, number>();
  for (const line of split(input)) {
    remaining.set(line, (remaining.get(line) ?? 0) + 1);
  }
  let changed = 0;
  for (const line of split(output)) {
    const left = remaining.get(line) ?? 0;
    if (left > 0) remaining.set(line, left - 1);
    else changed++;
  }
  return changed;
}
