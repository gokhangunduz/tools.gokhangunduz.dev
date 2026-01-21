import type { Options } from "prettier";
import { ToolError } from "../text-tool";

/**
 * Prettier, in the browser.
 *
 * The standalone build plus one plugin per language, each imported only when
 * that language is chosen — the full set is over a megabyte, and nobody
 * formatting JSON should pay for the TypeScript parser. This is why the tool
 * is async and why `format-code` is the one page that fetches anything
 * substantial.
 */
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
    // The estree printer too: prettier parses JSON with babel but prints it
    // through the same printer as JavaScript.
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

export type FormatOptions = {
  language: Language;
  width: number;
  tabWidth: number;
  semi: boolean;
  singleQuote: boolean;
};

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
      semi: options.semi,
      singleQuote: options.singleQuote,
    });
  } catch (cause) {
    // Prettier's message names the line and column, which is the whole value
    // of the error — so it is passed through rather than replaced.
    const detail = cause instanceof Error ? firstLine(cause.message) : "";
    throw new ToolError({
      tr: `Ayrıştırılamadı: ${detail}`,
      en: `Could not parse: ${detail}`,
    });
  }
}

function firstLine(message: string): string {
  return message.split("\n").slice(0, 3).join(" ").trim();
}
