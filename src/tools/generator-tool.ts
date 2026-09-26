import type { Locale, Localized } from "@/i18n";
import type { OptionValues, Tone, ToolOption } from "./text-tool";

/**
 * What a generator produces. A string is one value per line. `items` with a
 * `text` shows the values as rows while Copy all and Download take `text`,
 * for a list formatted as a JSON array or an SQL `IN (...)`.
 */
export type Generated = string | { items: string[]; text?: string };

/**
 * The contract for tools that take nothing and produce something.
 *
 * A UUID, a password, a key pair: there is no input box to fill, so the page
 * is options and a button. It regenerates on mount and whenever an option
 * changes, because a generator that shows an empty box until you press
 * something is one click of ceremony for no reason.
 */
export type GeneratorSpec = {
  generate: (
    options: OptionValues,
    locale: Locale,
  ) => Generated | Promise<Generated>;
  options?: ToolOption[];
  outputExtension?: string;
  footnote?: (output: string, options: OptionValues) => Localized | null;
  /** A short figure beside the output label, such as a strength rating. */
  headline?: (
    output: string,
    options: OptionValues,
  ) => { text: Localized; tone?: Tone } | null;
};

export function toGenerated(value: Generated): {
  items: string[];
  text: string;
} {
  if (typeof value !== "string") {
    return { items: value.items, text: value.text ?? value.items.join("\n") };
  }
  return { items: value === "" ? [] : value.split("\n"), text: value };
}
