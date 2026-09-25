import type { Locale, Localized } from "@/i18n";
import type { OptionValues, ToolOption } from "./text-tool";

/**
 * The contract for tools that take nothing and produce something.
 *
 * A UUID, a password, a key pair: there is no input box to fill, so the page
 * is options and a button. It regenerates on mount and whenever an option
 * changes, because a generator that shows an empty box until you press
 * something is one click of ceremony for no reason.
 */
export type GeneratorSpec = {
  generate: (options: OptionValues, locale: Locale) => string | Promise<string>;
  options?: ToolOption[];
  outputExtension?: string;
  footnote?: (output: string, options: OptionValues) => Localized | null;
};
