import type { Locale } from "@/i18n";

/**
 * Is this file valid, and if not, where?
 *
 * The formatters already answer that as a side effect, but the question is
 * asked on its own often enough — a config that a deploy rejected, a file
 * pasted out of a log — and then the answer wanted is a line number, not a
 * reformatted document.
 */
export type Language = "json" | "yaml" | "toml" | "xml" | "csv";

export async function validate(
  input: string,
  language: Language,
  locale: Locale,
): Promise<string> {
  if (!input.trim()) return "";

  const problem = await check(input, language);
  if (!problem) {
    return locale === "tr"
      ? `✓ Geçerli ${language.toUpperCase()}`
      : `✓ Valid ${language.toUpperCase()}`;
  }
  return `✗ ${problem}`;
}

async function check(
  input: string,
  language: Language,
): Promise<string | null> {
  try {
    switch (language) {
      case "json":
        JSON.parse(input);
        return null;
      case "yaml": {
        const yaml = await import("js-yaml");
        yaml.loadAll(input);
        return null;
      }
      case "toml": {
        const { parse } = await import("smol-toml");
        parse(input);
        return null;
      }
      case "xml": {
        const { XMLValidator } = await import("fast-xml-parser");
        const verdict = XMLValidator.validate(input, {
          allowBooleanAttributes: true,
        });
        if (verdict === true) return null;
        const { line, col, msg } = verdict.err;
        return `satır ${line}, sütun ${col} / line ${line}, column ${col}: ${msg}`;
      }
      case "csv": {
        const Papa = (await import("papaparse")).default;
        const result = Papa.parse(input, { skipEmptyLines: true });
        const error = result.errors[0];
        if (!error) return null;
        return `satır ${(error.row ?? 0) + 1} / row ${(error.row ?? 0) + 1}: ${error.message}`;
      }
    }
  } catch (cause) {
    return cause instanceof Error
      ? cause.message.split("\n").slice(0, 4).join(" ")
      : String(cause);
  }
}
