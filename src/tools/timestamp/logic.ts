import type { Locale, Localized } from "@/i18n";
import { ToolError, type ResultRow } from "../text-tool";
import { readDateText } from "../timezone/dates";
import {
  formatOffset,
  isoInZone,
  offsetOf,
  resolveZone,
  requireZone,
  wallClockIn,
} from "../timezone/zones";

/**
 * Whatever timestamp was pasted, in every form it might be needed in.
 *
 * The unit is read from the digit count: ten digits are seconds until 2286,
 * thirteen are milliseconds, sixteen microseconds, nineteen nanoseconds. That
 * is why the user does not have to say which one they have.
 */
export type Unit = "s" | "ms" | "us" | "ns";
export type UnitChoice = Unit | "auto";

export const UNIT_LABELS: Record<Unit, Localized> = {
  s: { tr: "saniye", en: "seconds" },
  ms: { tr: "milisaniye", en: "milliseconds" },
  us: { tr: "mikrosaniye", en: "microseconds" },
  ns: { tr: "nanosaniye", en: "nanoseconds" },
};

const PER_MS: Record<Unit, bigint> = {
  s: 1n,
  ms: 1n,
  us: 1000n,
  ns: 1_000_000n,
};
const MAX_MS = 8.64e15;

export function detectUnit(digits: string): Unit {
  const length = digits.replace(/^0+(?=\d)/, "").length;
  if (length <= 11) return "s";
  if (length <= 14) return "ms";
  if (length <= 17) return "us";
  if (length <= 19) return "ns";
  throw new ToolError({
    tr: "Sayı çok uzun: en fazla 19 basamak (nanosaniye) okunur.",
    en: "The number is too long: at most 19 digits (nanoseconds) are read.",
  });
}

export type Parsed = { date: Date; unit: Unit | null; zoned: boolean };

export function parseInput(
  input: string,
  {
    zone = "UTC",
    unit = "auto",
    now = new Date(),
  }: { zone?: string; unit?: UnitChoice; now?: Date } = {},
): Parsed {
  const trimmed = input.trim();
  if (!trimmed) throw new ToolError({ tr: "Boş.", en: "Empty." });

  const numeric = /^(-?)(\d+)(?:[.,](\d+))?$/.exec(trimmed.replace(/_/g, ""));
  if (numeric) {
    const [, sign, whole, fraction] = numeric;
    const chosen = unit === "auto" ? detectUnit(whole) : unit;
    const integer = BigInt(whole);
    let ms =
      chosen === "s"
        ? Number(integer * 1000n)
        : chosen === "ms"
          ? Number(integer)
          : Number(integer / PER_MS[chosen]) +
            Number(integer % PER_MS[chosen]) / Number(PER_MS[chosen]);
    if (fraction) {
      const scale =
        chosen === "s"
          ? 1000
          : chosen === "ms"
            ? 1
            : 1 / Number(PER_MS[chosen]);
      ms += Number(`0.${fraction}`) * scale;
    }
    ms = Math.floor(ms);
    if (sign) ms = -ms;
    if (!Number.isFinite(ms) || Math.abs(ms) > MAX_MS) {
      throw new ToolError({
        tr: "Bu sayı tarih aralığının dışında (±275 760 yıl).",
        en: "That number is outside the range a date can hold (±275,760 years).",
      });
    }
    return { date: new Date(ms), unit: chosen, zoned: false };
  }

  const read = readDateText(trimmed, zone, now);
  if (read) return { ...read, unit: null };

  if (/^[a-z]{3},?\s/i.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return { date: parsed, unit: null, zoned: false };
    }
  }
  throw new ToolError({
    tr: "Tarih anlaşılmadı. Unix timestamp, ISO 8601 ya da 25.09.2026 14:30 bekleniyor.",
    en: "Could not read the date. A Unix timestamp, ISO 8601 or 25.09.2026 14:30 is expected.",
  });
}

export type Description = {
  rows: ResultRow[];
  unit: Unit | null;
  /** The input had no offset and was read as a wall clock in `zone`. */
  zoned: boolean;
  zone: string | null;
  /** The zone option is wrong; the rows that do not need it are still there. */
  zoneError: ToolError | null;
  text: string;
};

function zoneRow(date: Date, locale: Locale, zone: string): string {
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: zone,
  }).format(date);
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: zone,
  }).format(date);
  const clock = wallClockIn(date, zone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${weekday}, ${day} ${pad(clock.hour)}:${pad(clock.minute)}:${pad(clock.second)} (${formatOffset(offsetOf(date, zone))})`;
}

export function describe(
  input: string,
  locale: Locale,
  zoneInput: string,
  unit: UnitChoice = "auto",
  now = new Date(),
): Description {
  const zone = resolveZone(zoneInput);
  let zoneError: ToolError | null = null;
  if (!zone) {
    try {
      requireZone(zoneInput, "timeZone");
    } catch (error) {
      zoneError = error as ToolError;
    }
  }

  const parsed = parseInput(input, { zone: zone ?? "UTC", unit, now });
  if (parsed.zoned && zoneError) throw zoneError;
  return describeDate(parsed, locale, zone, zoneError, now);
}

/** The rows for an instant: also what the page shows for "now" while the input is empty. */
export function describeDate(
  { date, unit, zoned }: Parsed,
  locale: Locale,
  zone: string | null,
  zoneError: ToolError | null = null,
  now = new Date(),
): Description {
  const tr = locale === "tr";
  const ms = date.getTime();
  const rows: ResultRow[] = [
    { label: "Unix (s)", value: String(Math.floor(ms / 1000)) },
    { label: "Unix (ms)", value: String(ms) },
    { label: "ISO 8601 (UTC)", value: date.toISOString() },
  ];
  if (zone) {
    rows.push(
      {
        label: tr ? "ISO 8601 (yerel)" : "ISO 8601 (local)",
        value: isoInZone(date, zone),
      },
      { label: zone, value: zoneRow(date, locale, zone) },
    );
  }
  rows.push(
    { label: "RFC 7231", value: date.toUTCString() },
    { label: tr ? "Göreli" : "Relative", value: relative(date, locale, now) },
  );
  const width = Math.max(...rows.map((row) => String(row.label).length));
  const text = rows
    .map((row) => `${String(row.label).padEnd(width)}  ${row.value}`)
    .join("\n");
  return { rows, unit, zoned, zone, zoneError, text };
}

/** "3 gün önce" rather than a second timestamp to subtract by hand. */
export function relative(date: Date, locale: Locale, now = new Date()): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const seconds = (date.getTime() - now.getTime()) / 1000;
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
