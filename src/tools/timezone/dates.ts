import { ToolError } from "../text-tool";
import { instantOf, wallClockIn, type WallClock } from "./zones";

export type ReadDate = { date: Date; zoned: boolean };

const TIME = String.raw`(\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?`;
const ISO = new RegExp(
  String.raw`^(\d{4})-(\d{2})-(\d{2})(?:[T\s]+${TIME})?$`,
  "i",
);
const DOTTED = new RegExp(
  String.raw`^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+${TIME})?$`,
);
const CLOCK = new RegExp(String.raw`^${TIME}$`);
const OFFSET =
  /^(.*\d:\d{2}(?::\d{2}(?:[.,]\d+)?)?)\s*(z|utc|gmt|[+-]\d{1,2}(?::?\d{2})?)$/i;
const DATE_ONLY_OFFSET = /^(\d{4}-\d{2}-\d{2})\s*(z)$/i;

function unreadable() {
  return new ToolError({
    tr: 'Tarih anlaşılmadı. "2026-09-25 14:30", "25.09.2026 14:30", "14:30" ya da ISO 8601 bekleniyor.',
    en: 'Could not read the date. Try "2026-09-25 14:30", "25.09.2026 14:30", "14:30" or ISO 8601.',
  });
}

function outOfRange() {
  return new ToolError({
    tr: "Tarihte olmayan bir değer var (ay 1–12, gün ayın gün sayısı, saat 0–23, dakika ve saniye 0–59).",
    en: "The date has a value that does not exist (month 1–12, day within the month, hour 0–23, minute and second 0–59).",
  });
}

function fraction(digits: string | undefined): number {
  return digits ? Math.floor(Number(`0.${digits}`) * 1000) : 0;
}

function checked(clock: WallClock): WallClock {
  const last = new Date(0);
  last.setUTCFullYear(clock.year, clock.month, 0);
  if (
    clock.month < 1 ||
    clock.month > 12 ||
    clock.day < 1 ||
    clock.day > last.getUTCDate() ||
    clock.hour > 23 ||
    clock.minute > 59 ||
    clock.second > 59
  ) {
    throw outOfRange();
  }
  return clock;
}

function wallClockOf(text: string, zone: string, now: Date): WallClock | null {
  let match = ISO.exec(text);
  if (match) {
    const [, y, mo, d, h, mi, s, f] = match;
    return checked({
      year: Number(y),
      month: Number(mo),
      day: Number(d),
      hour: Number(h ?? 0),
      minute: Number(mi ?? 0),
      second: Number(s ?? 0),
      millisecond: fraction(f),
    });
  }
  match = DOTTED.exec(text);
  if (match) {
    const [, d, mo, y, h, mi, s, f] = match;
    return checked({
      year: Number(y),
      month: Number(mo),
      day: Number(d),
      hour: Number(h ?? 0),
      minute: Number(mi ?? 0),
      second: Number(s ?? 0),
      millisecond: fraction(f),
    });
  }
  match = CLOCK.exec(text);
  if (match) {
    const [, h, mi, s, f] = match;
    const today = wallClockIn(now, zone);
    return checked({
      year: today.year,
      month: today.month,
      day: today.day,
      hour: Number(h),
      minute: Number(mi),
      second: Number(s ?? 0),
      millisecond: fraction(f),
    });
  }
  return null;
}

function offsetMinutes(token: string): number {
  if (/^(z|utc|gmt)$/i.test(token)) return 0;
  const [, sign, hh, mm] = /^([+-])(\d{1,2}):?(\d{2})?$/.exec(token) ?? [];
  const hours = Number(hh);
  const minutes = Number(mm ?? 0);
  if (hours > 14 || minutes > 59) throw outOfRange();
  return (sign === "-" ? -1 : 1) * (hours * 60 + minutes);
}

function utcOf(clock: WallClock): number {
  const date = new Date(0);
  date.setUTCFullYear(clock.year, clock.month - 1, clock.day);
  date.setUTCHours(
    clock.hour,
    clock.minute,
    clock.second,
    clock.millisecond ?? 0,
  );
  return date.getTime();
}

/**
 * A written date. Without an offset it is read as a wall clock in `zone`
 * (`zoned: true`); with Z, UTC, GMT or ±HH[:MM] it is already an instant. A
 * bare time is today in `zone`. Returns null for text that is not a date form
 * at all, so the caller can try its own formats first.
 */
export function readDateText(
  input: string,
  zone: string,
  now = new Date(),
): ReadDate | null {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text) return null;

  const dateOnly = DATE_ONLY_OFFSET.exec(text);
  const withOffset = dateOnly ?? OFFSET.exec(text);
  if (withOffset) {
    const clock = wallClockOf(withOffset[1].trim(), "UTC", now);
    if (!clock) {
      const parsed = new Date(text);
      if (Number.isNaN(parsed.getTime())) throw unreadable();
      return { date: parsed, zoned: false };
    }
    return {
      date: new Date(utcOf(clock) - offsetMinutes(withOffset[2]) * 60_000),
      zoned: false,
    };
  }

  const clock = wallClockOf(text, zone, now);
  if (clock) return { date: instantOf(clock, zone), zoned: true };

  if (/[a-z]{3}.*\b(gmt|utc)\b|[+-]\d{4}$/i.test(text)) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return { date: parsed, zoned: false };
  }
  return null;
}

export { unreadable as unreadableDate };
