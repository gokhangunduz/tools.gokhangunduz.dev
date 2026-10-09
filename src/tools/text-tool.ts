import type { Locale, Localized } from "@/i18n";

export type OptionValue = string | boolean;
export type OptionValues = Record<string, OptionValue>;

type OptionBase = {
  id: string;
  label: Localized;

  hint?: Localized;

  directions?: string[];

  visibleWhen?: (values: OptionValues) => boolean;

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

      primary?: true;

      sensitive?: true;
    });

export type Tone = "success" | "warning" | "destructive" | "muted";

export type ResultRow = {
  label: Localized | string;
  value: string;
  hint?: Localized;
  tone?: Tone;

  copy?: false;
};

export type ResultGroup = { label: Localized | string; rows: ResultRow[] };

export type TextResult = {
  text: string;
  rows?: ResultRow[];
  groups?: ResultGroup[];
};

export type RunResult = string | TextResult;

export type ToolAction = {
  label: Localized;
  direction?: string;
  values?: OptionValues;
};

export type PerValues<T> = T | ((options: OptionValues) => T);

export type Direction = {
  id: string;
  label: Localized;

  run: (
    input: string,
    options: OptionValues,
    locale: Locale,
  ) => RunResult | Promise<RunResult>;

  sample?: string;

  sampleOptions?: OptionValues;

  placeholder?: Localized;

  footnote?: (
    input: string,
    output: string,
    options: OptionValues,
  ) => Localized | null;

  footnoteOnError?: boolean;

  headline?: (
    output: string,
    input: string,
    options: OptionValues,
  ) => { text: Localized; tone?: Tone } | null;

  hint?: (
    input: string,
    options: OptionValues,
  ) => { text: Localized; action?: ToolAction } | null;

  outputWrap?: PerValues<"off" | "anywhere" | undefined>;

  outputExtension?: PerValues<string>;

  outputFilename?: (options: OptionValues) => string;

  debounce?: number;
};

export type TextToolSpec = {
  directions: Direction[];
  options?: ToolOption[];

  outputExtension?: string;

  preview?: "svg";

  input?: "line";

  code?: PerValues<boolean>;

  outputWrap?: PerValues<"off" | "anywhere" | undefined>;

  download?: boolean;

  inverse?: true;

  acceptFile?: string;

  inputFootnote?: (input: string, options: OptionValues) => Localized | null;

  share?: false;

  trigger?: "live" | "submit";

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

export function positionAt(text: string, offset: number): TextPosition {
  const before = text.slice(0, Math.max(0, offset));
  const lastBreak = before.lastIndexOf("\n");
  return {
    line: before.split("\n").length,
    column: before.length - lastBreak,
  };
}

export function offsetAt(text: string, { line, column }: TextPosition): number {
  const lines = text.split("\n");
  const row = Math.min(Math.max(line, 1), lines.length) - 1;
  let offset = 0;
  for (let i = 0; i < row; i++) offset += lines[i].length + 1;
  return offset + Math.min(Math.max(column - 1, 0), lines[row].length);
}

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
