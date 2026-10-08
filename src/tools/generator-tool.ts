import type { Locale, Localized } from "@/i18n";
import type { OptionValues, Tone, ToolOption } from "./text-tool";

export type Generated = string | { items: string[]; text?: string };

export type GeneratorSpec = {
  generate: (
    options: OptionValues,
    locale: Locale,
  ) => Generated | Promise<Generated>;
  options?: ToolOption[];
  outputExtension?: string;
  footnote?: (output: string, options: OptionValues) => Localized | null;

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
