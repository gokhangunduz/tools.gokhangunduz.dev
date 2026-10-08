import type { ReactNode } from "react";
import type { Locale, Localized } from "@/i18n";
import type { OptionValues, Tone, ToolOption } from "./text-tool";

export type DualHeadline = { text: Localized; tone?: Tone };

export type DualResult<T = unknown> = {
  text: string;
  data?: T;

  headline?: DualHeadline | null;

  copies?: { label: Localized; text: string }[];
};

type Side = { label: Localized; placeholder?: Localized; sample?: string };

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

  bothRequired?: true;

  renderOutput?: (result: DualResult<T>, locale: Locale) => ReactNode;

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
