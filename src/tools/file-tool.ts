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
  text?: string;

  blob?: Blob;
  filename?: string;

  previewUrl?: string;

  stats?: FileStats;

  note?: Localized;
};

export type FileToolSpec = {
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
