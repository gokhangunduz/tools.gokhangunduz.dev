import type { Locale, Localized } from "@/i18n";
import type { OptionValues, ToolOption } from "./text-tool";

/**
 * The contract for tools whose input is a file.
 *
 * Image conversion, QR reading, EXIF: the input is picked or dropped rather
 * than typed, and the result may be a new file rather than text. Everything
 * happens in the page — `FileReader` and a canvas — so the file never leaves
 * the machine, which for photographs matters more than for most things this
 * site does.
 */
export type FileResult = {
  /** Shown in the output box. */
  text?: string;
  /** Offered as a download, and previewed when it is an image. */
  blob?: Blob;
  filename?: string;
  /** One line under the result. */
  note?: Localized;
};

export type FileToolSpec = {
  /** The `accept` attribute, e.g. "image/*". */
  accept: string;
  run: (
    file: File,
    options: OptionValues,
    locale: Locale,
  ) => Promise<FileResult>;
  options?: ToolOption[];
};
