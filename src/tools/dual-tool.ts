import type { ReactNode } from "react";
import type { Locale, Localized } from "@/i18n";
import type { OptionValues, Tone, ToolOption } from "./text-tool";

export type DualHeadline = { text: Localized; tone?: Tone };

/**
 * What a comparison produces. `text` is what Copy and Download take, so it
 * reads on its own; `data` is whatever `renderOutput` needs to draw it.
 */
export type DualResult<T = unknown> = {
  text: string;
  data?: T;
  /** Replaces the spec's `footnote` badge, for counts only known after an async run. */
  headline?: DualHeadline | null;
  /** More copy buttons beside the main one, such as the same diff as a patch. */
  copies?: { label: Localized; text: string }[];
};

type Side = { label: Localized; placeholder?: Localized; sample?: string };

/**
 * The contract for tools that compare two things.
 *
 * A diff, a list comparison, a schema checked against a document: the shape is
 * two inputs and one output, which the single-input contract cannot express
 * without pushing one side into an option field where a paragraph does not
 * fit.
 *
 * A `ToolError` whose `field` is "left" or "right" marks that pane, and its
 * `at` becomes a link to the position in it.
 */
export type DualToolSpec<T = unknown> = {
  left: Side;
  right: Side;
  run: (
    left: string,
    right: string,
    options: OptionValues,
  ) => string | DualResult<T> | Promise<string | DualResult<T>>;
  options?: ToolOption[];
  outputExtension?: string;
  /** Waits for both sides instead of comparing one against nothing. */
  bothRequired?: true;
  /** Draws the result instead of the plain text box; Copy still takes `text`. */
  renderOutput?: (result: DualResult<T>, locale: Locale) => ReactNode;
  /** A short figure in the output header — how many differences, whether it validated. */
  footnote?: (
    left: string,
    right: string,
    output: string,
    options: OptionValues,
  ) => Localized | DualHeadline | null;
};

export function toDualResult<T>(value: string | DualResult<T>): DualResult<T> {
  return typeof value === "string" ? { text: value } : value;
}
