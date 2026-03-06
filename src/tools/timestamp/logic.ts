import type { Locale } from "@/i18n";
import { ToolError } from "../text-tool";

/**
 * Whatever timestamp was pasted, in every form it might be needed in.
 *
 * Seconds and milliseconds are told apart by magnitude: a value past ~1e11 is
 * milliseconds, because seconds would put it in the year 5138. That heuristic
 * is why this does not need the user to say which one they have, which is the
 * whole reason to reach for the tool.
 */
const MS_THRESHOLD = 1e11;

export function parseInput(input: string): Date {
  const trimmed = input.trim();
  if (!trimmed) throw new ToolError({ tr: "Boş.", en: "Empty." });

  if (/^-?\d+$/.test(trimmed)) {
    const numeric = Number(trimmed);
    const ms = Math.abs(numeric) >= MS_THRESHOLD ? numeric : numeric * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      throw new ToolError({
        tr: "Bu sayı bir tarihe karşılık gelmiyor.",
        en: "That number is not a date.",
      });
    }
    return date;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new ToolError({
      tr: "Tarih anlaşılmadı. Unix zaman damgası ya da ISO 8601 bekleniyor.",
      en: "Could not read the date. A Unix timestamp or ISO 8601 is expected.",
    });
  }
  return parsed;
}

export function describe(
  input: string,
  locale: Locale,
  timeZone: string,
): string {
  const date = parseInput(input);
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const rows: [string, string][] = [
    ["unix (s)", String(Math.floor(date.getTime() / 1000))],
    ["unix (ms)", String(date.getTime())],
    ["ISO 8601 (UTC)", date.toISOString()],
    ["RFC 2822", date.toUTCString()],
    [zone, format(date, locale, zone)],
    ["UTC", format(date, locale, "UTC")],
    [locale === "tr" ? "göreli" : "relative", relative(date, locale)],
    [locale === "tr" ? "hafta günü" : "weekday", weekday(date, locale, zone)],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, value]) => `${label.padEnd(width)}  ${value}`)
    .join("\n");
}

function format(date: Date, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone,
  }).format(date);
}

function weekday(date: Date, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone }).format(
    date,
  );
}

/** "3 gün önce" rather than a second timestamp to subtract by hand. */
export function relative(date: Date, locale: Locale): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const seconds = (date.getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }
  return formatter.format(Math.round(seconds), "second");
}

export function now(): string {
  return String(Math.floor(Date.now() / 1000));
}
