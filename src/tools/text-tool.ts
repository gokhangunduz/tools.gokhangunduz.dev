import type { Locale, Localized } from "@/i18n";

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

type OptionBase = {
  id: string;
  label: Localized;
  /** Shown as the control's tooltip and accessible description. */
  hint?: Localized;
  /** Only shown while one of these directions is active. */
  directions?: string[];
  /** Only shown while this returns true for the current values. */
  visibleWhen?: (values: OptionValues) => boolean;
  /** Never written into the shared link: a key, a secret, a password. */
  secret?: true;
};

export type ToolOption =
  | (OptionBase & {
      kind: "switch";
      default: boolean;
    })
  | (OptionBase & {
      kind: "select";
      default: string;
      choices: { value: string; label: Localized }[];
    })
  | (OptionBase & {
      kind: "text";
      default: string;
      placeholder?: Localized;
      width?: "sm" | "md" | "fill";
      /** The option the tool is about: first, on its own full-width row. */
      primary?: true;
      /** Masked behind a show/hide toggle, and never autocompleted. */
      sensitive?: true;
    });

export type Tone = "success" | "warning" | "destructive" | "muted";

/** One labelled value in a structured result; each gets its own copy button. */
export type ResultRow = {
  label: Localized | string;
  value: string;
  hint?: Localized;
  tone?: Tone;
  /** false for a notice ("no records") rather than a value worth copying. */
  copy?: false;
};

export type ResultGroup = { label: Localized | string; rows: ResultRow[] };

/**
 * A result that is a set of named values rather than one blob of text. `text`
 * is still what Copy and Download take, so it should read well on its own.
 */
export type TextResult = {
  text: string;
  rows?: ResultRow[];
  groups?: ResultGroup[];
};

export type RunResult = string | TextResult;

/** A one-click fix offered next to an error or hint: another direction, other option values. */
export type ToolAction = {
  label: Localized;
  direction?: string;
  values?: OptionValues;
};

/** A setting that may depend on the current option values. */
export type PerValues<T> = T | ((options: OptionValues) => T);

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
  /**
   * The locale is passed through for the few tools whose *output* is language
   * dependent — a collation order, a formatted date, a table of labels. Most
   * ignore it.
   */
  run: (
    input: string,
    options: OptionValues,
    locale: Locale,
  ) => RunResult | Promise<RunResult>;
  /** Prefilled when the user asks for a sample, per direction. */
  sample?: string;
  /**
   * Option values the sample needs to make sense — a key for a tool that
   * signs, a passphrase for one that encrypts. Without these the sample
   * button demonstrates an error message.
   */
  sampleOptions?: OptionValues;
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
  /**
   * Also calls `footnote` while the input is in error, with an empty output,
   * for notes computed from the input alone (a capacity counter).
   */
  footnoteOnError?: boolean;
  /** A short figure next to the output label, such as "96 B · −31%". */
  headline?: (
    output: string,
    input: string,
    options: OptionValues,
  ) => { text: Localized; tone?: Tone } | null;
  /** A note above the output about the input itself, e.g. "this already looks encoded". */
  hint?: (
    input: string,
    options: OptionValues,
  ) => { text: Localized; action?: ToolAction } | null;
  /** Output wrapping for this direction; wins over the tool's own. */
  outputWrap?: PerValues<"off" | "anywhere" | undefined>;
  /** Download extension for this direction; wins over the tool's own. */
  outputExtension?: PerValues<string>;
  /** Full download filename, extension included, when it depends on the options. */
  outputFilename?: (options: OptionValues) => string;
  /**
   * Milliseconds to wait after the last keystroke. Defaults to 250 for async
   * directions and inputs over 20 KB, and to none otherwise.
   */
  debounce?: number;
};

export type TextToolSpec = {
  directions: Direction[];
  options?: ToolOption[];
  /** Extension used by the download button, without the dot. */
  outputExtension?: string;
  /** Renders the output as an image above its source, for tools whose output is an SVG. */
  preview?: "svg";
  /** A one-line value (a domain, an IP, a timestamp) gets a single input and the whole frame for its result. */
  input?: "line";
  /** Source code on both sides: no soft wrap, and a line-number gutter. */
  code?: PerValues<boolean>;
  /** "off" keeps long lines whole; "anywhere" breaks a long token at any character. */
  outputWrap?: PerValues<"off" | "anywhere" | undefined>;
  /**
   * The download button. Shown by default, except on line tools that declare
   * no extension, where a .txt of one short value is noise.
   */
  download?: boolean;
  /** The two directions undo each other, so the output can become the next input. */
  inverse?: true;
  /** A text file can be dropped or opened into the input: an `accept` list such as ".js,.css". */
  acceptFile?: string;
  /** Replaces the character count under the input. */
  inputFootnote?: (input: string, options: OptionValues) => Localized | null;
  /**
   * false keeps the input, direction and options out of the URL fragment, for
   * tools whose main input is a secret.
   */
  share?: false;
  /**
   * "submit" runs only on Enter or the submit button, and re-runs the last
   * submitted value when an option changes. The default for network tools.
   */
  trigger?: "live" | "submit";
  /** Runs with an empty input too, e.g. an IP lookup that then shows your own. */
  runOnEmpty?: true;
};

export function resolvePerValues<T>(
  value: PerValues<T>,
  options: OptionValues,
): T {
  return typeof value === "function"
    ? (value as (options: OptionValues) => T)(options)
    : value;
}

export function defaultValues(options: ToolOption[] = []): OptionValues {
  return Object.fromEntries(options.map((o) => [o.id, o.default]));
}

export type TextPosition = { line: number; column: number };

/**
 * An error whose message is already user-facing in both languages.
 *
 * `at` points into the input (1-based line and column) and is appended to the
 * message; `detail` is the message without it. `field` names the option that
 * is wrong. `action` offers the fix as a button.
 */
export class ToolError extends Error {
  readonly localized: Localized;
  readonly detail: Localized;
  readonly at?: TextPosition;
  readonly field?: string;
  readonly action?: ToolAction;

  constructor(
    localized: Localized,
    {
      at,
      field,
      action,
    }: { at?: TextPosition; field?: string; action?: ToolAction } = {},
  ) {
    const full = at
      ? {
          tr: `${localized.tr} (satır ${at.line}, sütun ${at.column})`,
          en: `${localized.en} (line ${at.line}, column ${at.column})`,
        }
      : localized;
    super(full.en);
    this.name = "ToolError";
    this.localized = full;
    this.detail = localized;
    this.at = at;
    this.field = field;
    this.action = action;
  }
}

/** Line and column (1-based) of a UTF-16 offset. */
export function positionAt(text: string, offset: number): TextPosition {
  const before = text.slice(0, Math.max(0, offset));
  const lastBreak = before.lastIndexOf("\n");
  return {
    line: before.split("\n").length,
    column: before.length - lastBreak,
  };
}

/** The UTF-16 offset of a position, clamped to the text. */
export function offsetAt(text: string, { line, column }: TextPosition): number {
  const lines = text.split("\n");
  const row = Math.min(Math.max(line, 1), lines.length) - 1;
  let offset = 0;
  for (let i = 0; i < row; i++) offset += lines[i].length + 1;
  return offset + Math.min(Math.max(column - 1, 0), lines[row].length);
}

/** The options that apply to the current direction and values. */
export function visibleOptions(
  options: ToolOption[] = [],
  values: OptionValues,
  direction?: string,
): ToolOption[] {
  return options.filter(
    (option) =>
      (!direction ||
        !option.directions ||
        option.directions.includes(direction)) &&
      (!option.visibleWhen || option.visibleWhen(values)),
  );
}

/** Option values worth carrying in a link: changed from the default, and not secret. */
export function shareableValues(
  options: ToolOption[] = [],
  values: OptionValues,
): OptionValues {
  return Object.fromEntries(
    options
      .filter(
        (option) =>
          !option.secret &&
          option.id in values &&
          values[option.id] !== option.default,
      )
      .map((option) => [option.id, values[option.id]]),
  );
}

/** Values from a link, keeping only known, non-secret options of the right type. */
export function restoreValues(
  options: ToolOption[] = [],
  shared: Record<string, unknown> | undefined,
): OptionValues {
  const values = defaultValues(options);
  if (!shared) return values;
  for (const option of options) {
    const value = shared[option.id];
    if (option.secret || value === undefined) continue;
    if (option.kind === "switch" && typeof value === "boolean") {
      values[option.id] = value;
    } else if (
      option.kind === "select" &&
      option.choices.some((choice) => choice.value === value)
    ) {
      values[option.id] = value as string;
    } else if (option.kind === "text" && typeof value === "string") {
      values[option.id] = value;
    }
  }
  return values;
}

export function toTextResult(result: RunResult): TextResult {
  return typeof result === "string" ? { text: result } : result;
}

export function measureText(value: string): {
  chars: number;
  bytes: number;
  lines: number;
} {
  return {
    chars: [...value].length,
    bytes: new TextEncoder().encode(value).length,
    lines: value === "" ? 0 : value.split("\n").length,
  };
}

/** The dropped file's name without its extension, then the tool's extension: icon.svg → icon.min.svg. */
export function downloadName({
  fallback,
  source,
  extension,
}: {
  fallback: string;
  source?: string | null;
  extension: string;
}): string {
  const base = source?.replace(/\.[^./\\]+$/, "").trim() || fallback;
  return `${base}.${extension}`;
}

/** Whether a file matches an `accept` list of extensions and MIME types. */
export function acceptsFile(
  file: { name: string; type: string },
  accept: string,
): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => {
      if (entry.startsWith(".")) return name.endsWith(entry);
      if (entry.endsWith("/*")) return type.startsWith(entry.slice(0, -1));
      return type === entry;
    });
}
