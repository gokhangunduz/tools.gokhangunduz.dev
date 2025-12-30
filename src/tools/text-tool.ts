import type { Localized } from "@/i18n";

/**
 * The shape almost every tool here has: text in, text out, a handful of
 * switches, and — for anything that has an inverse — a direction.
 *
 * Declaring it as data rather than building a page per tool is what keeps a
 * hundred tools maintainable: the input box, the debounce, the error line, the
 * copy button, the shared link and the keyboard shortcuts are written once.
 * A tool that genuinely does not fit (a diff with two inputs, a QR reader that
 * takes a file) ships its own component instead; nothing forces it through
 * this.
 */
export type OptionValue = string | boolean;
export type OptionValues = Record<string, OptionValue>;

export type ToolOption =
  | {
      kind: "switch";
      id: string;
      label: Localized;
      default: boolean;
    }
  | {
      kind: "select";
      id: string;
      label: Localized;
      default: string;
      choices: { value: string; label: Localized }[];
    }
  | {
      kind: "text";
      id: string;
      label: Localized;
      default: string;
      placeholder?: Localized;
    };

/**
 * One direction of a reversible tool — "encode" and "decode", say.
 *
 * `run` throws on bad input, or rejects if it is async. The message is shown
 * to the user as written, so it is localized copy, not a developer's
 * exception string.
 *
 * Returning a promise is for work that cannot be synchronous — WebCrypto and
 * anything behind a wasm module — not for work that is merely slow. The
 * component shows the previous result until the new one resolves.
 */
export type Direction = {
  id: string;
  label: Localized;
  run: (input: string, options: OptionValues) => string | Promise<string>;
  /** Prefilled when the user asks for a sample, per direction. */
  sample?: string;
  /** Overrides the input box placeholder for this direction. */
  placeholder?: Localized;
  /**
   * One line under the output, for the fact the result does not carry — how
   * much a compression saved, how long a hash is, when a token expires.
   * Returns null when there is nothing worth saying.
   */
  footnote?: (
    input: string,
    output: string,
    options: OptionValues,
  ) => Localized | null;
};

export type TextToolSpec = {
  directions: Direction[];
  options?: ToolOption[];
  /** Extension used by the download button, without the dot. */
  outputExtension?: string;
};

export function defaultValues(options: ToolOption[] = []): OptionValues {
  return Object.fromEntries(options.map((o) => [o.id, o.default]));
}

/** An error whose message is already user-facing in both languages. */
export class ToolError extends Error {
  readonly localized: Localized;

  constructor(localized: Localized) {
    super(localized.en);
    this.name = "ToolError";
    this.localized = localized;
  }
}
