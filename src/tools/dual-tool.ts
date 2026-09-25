import type { Localized } from "@/i18n";
import type { OptionValues, ToolOption } from "./text-tool";

/**
 * The contract for tools that compare two things.
 *
 * A diff, a list comparison, a schema checked against a document: the shape is
 * two inputs and one output, which the single-input contract cannot express
 * without pushing one side into an option field where a paragraph does not
 * fit.
 */
export type DualToolSpec = {
  left: { label: Localized; placeholder?: Localized; sample?: string };
  right: { label: Localized; placeholder?: Localized; sample?: string };
  run: (
    left: string,
    right: string,
    options: OptionValues,
  ) => string | Promise<string>;
  options?: ToolOption[];
  outputExtension?: string;
  /** One line under the output — how many differences, whether it validated. */
  footnote?: (
    left: string,
    right: string,
    output: string,
    options: OptionValues,
  ) => Localized | null;
};
