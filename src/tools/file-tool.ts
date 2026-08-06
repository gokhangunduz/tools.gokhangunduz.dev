import type { Locale, Localized } from "@/i18n";
import { formatBytes } from "@/lib/image";
import {
  acceptsFile,
  ToolError,
  type OptionValues,
  type Tone,
  type ToolOption,
} from "./text-tool";

export type FileStats = { before: number; after: number };

export type FileResult = {
  /** Shown in the output box. */
  text?: string;
  /** Offered as a download, and previewed when it is an image. */
  blob?: Blob;
  filename?: string;
  /** Previewed instead of `blob`, e.g. a data URI the tool already built. */
  previewUrl?: string;
  /** Byte sizes of the input and the output, shown as the result's headline. */
  stats?: FileStats;
  /** One line under the result. */
  note?: Localized;
};

/**
 * The contract for tools whose input is a file.
 *
 * Image conversion, QR reading, EXIF: the input is picked or dropped rather
 * than typed, and the result may be a new file rather than text. Everything
 * happens in the page — `FileReader` and a canvas — so the file never leaves
 * the machine, which for photographs matters more than for most things this
 * site does.
 */
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

const FAMILIES: Record<string, Localized> = {
  image: { tr: "her görsel biçimi", en: "any image format" },
  text: { tr: "her metin dosyası", en: "any text file" },
  audio: { tr: "her ses dosyası", en: "any audio file" },
  video: { tr: "her video dosyası", en: "any video file" },
};

/** The `accept` list as a reader would say it: "SVG, PNG" or "any image format". */
export function acceptLabel(accept: string): Localized {
  const parts = { tr: [] as string[], en: [] as string[] };
  const add = (value: Localized) => {
    for (const locale of ["tr", "en"] as const) {
      if (!parts[locale].includes(value[locale])) {
        parts[locale].push(value[locale]);
      }
    }
  };

  for (const raw of accept.split(",")) {
    const entry = raw.trim().toLowerCase();
    if (!entry) continue;
    if (entry === "*/*" || entry === "*") {
      add({ tr: "her dosya", en: "any file" });
    } else if (entry.startsWith(".")) {
      const name = entry.slice(1).toUpperCase();
      add({ tr: name, en: name });
    } else if (entry.endsWith("/*")) {
      const family = entry.slice(0, -2);
      add(FAMILIES[family] ?? { tr: entry, en: entry });
    } else {
      const subtype = entry.split("/")[1] ?? entry;
      const name = subtype.replace(/^x-/, "").split("+")[0].toUpperCase();
      add({ tr: name, en: name });
    }
  }

  if (parts.en.length === 0) return { tr: "her dosya", en: "any file" };
  return { tr: parts.tr.join(", "), en: parts.en.join(", ") };
}

/**
 * The file to use out of those dropped or pasted: the first one the tool
 * accepts, and how many others were left out.
 */
export function chooseFile<F extends { name: string; type: string }>(
  files: readonly F[],
  accept: string,
): { file: F; ignored: number } {
  const file = files.find((candidate) => acceptsFile(candidate, accept));
  if (!file) {
    const first = files[0];
    const expected = acceptLabel(accept);
    const name = first ? first.name || first.type : "";
    throw new ToolError({
      tr: `Bu dosya burada kullanılamaz: ${name}. Beklenen: ${expected.tr}.`,
      en: `This file cannot be used here: ${name}. Expected: ${expected.en}.`,
    });
  }
  return { file, ignored: files.length - 1 };
}

/** The saving (or growth) from input to output, as a badge. */
export function statsHeadline({ before, after }: FileStats): {
  text: Localized;
  tone: Tone;
} {
  const size = formatBytes(after);
  if (before <= 0) return { text: { tr: size, en: size }, tone: "muted" };

  const percent = Math.round(Math.abs(after / before - 1) * 100);
  if (percent === 0 || after === before) {
    return {
      text: { tr: `${size} · %0`, en: `${size} · 0%` },
      tone: "muted",
    };
  }
  const sign = after < before ? "−" : "+";
  return {
    text: {
      tr: `${size} · ${sign}%${percent}`,
      en: `${size} · ${sign}${percent}%`,
    },
    tone: after < before ? "success" : "destructive",
  };
}
