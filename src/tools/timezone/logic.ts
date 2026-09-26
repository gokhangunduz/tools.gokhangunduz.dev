import type { Locale } from "@/i18n";
import { readDateText, unreadableDate } from "./dates";
import {
  formatOffset,
  isoInZone,
  offsetOf,
  requireZone,
  resolveZone,
  wallClockIn,
} from "./zones";

/**
 * One instant, in the zones a call actually gets scheduled across.
 *
 * The input is read *in a chosen zone* rather than in the browser's, because
 * the question is usually "the deploy window is 09:00 in Istanbul — what is
 * that in San Francisco", and typing a local time only to have it interpreted
 * as UTC is the mistake this is meant to prevent.
 */
export const DEFAULT_ZONES = [
  "Europe/Istanbul",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
];

export type ZoneRow = {
  zone: string;
  source: boolean;
  valid: boolean;
  time?: string;
  date?: string;
  /** Calendar days ahead of (+) or behind (−) the source zone. */
  dayDelta?: number;
  offset?: string;
  iso?: string;
};

export type Conversion = {
  source: string;
  isoUtc: string;
  isoSource: string;
  unix: string;
  rows: ZoneRow[];
  text: string;
};

/** Reads a wall-clock time as it would be read in `zone`. */
export function readInstant(
  input: string,
  zone: string,
  now = new Date(),
): Date {
  const text = input.trim();
  if (/^-?\d{9,}$/.test(text)) {
    const numeric = Number(text);
    return new Date(Math.abs(numeric) >= 1e11 ? numeric : numeric * 1000);
  }
  const read = readDateText(text, zone, now);
  if (!read) throw unreadableDate();
  return read.date;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dayNumber(date: Date, zone: string): number {
  const clock = wallClockIn(date, zone);
  return Math.round(
    Date.UTC(clock.year, clock.month - 1, clock.day) / 86_400_000,
  );
}

export function convertZones(
  input: string,
  sourceInput: string,
  extras: string[],
  locale: Locale,
  now = new Date(),
): Conversion | null {
  if (!input.trim()) return null;
  const source = requireZone(sourceInput, "source");
  const instant = readInstant(input, source, now);

  const extraZones = extras
    .map((zone) => zone.trim())
    .filter(Boolean)
    .map((zone) => resolveZone(zone) ?? zone);
  const zones = [...new Set([source, ...extraZones, ...DEFAULT_ZONES])];
  const sourceDay = dayNumber(instant, source);
  const dateFormat = (zone: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: zone,
    });

  const rows = zones.map((zone): ZoneRow => {
    const resolved = zone === source ? source : resolveZone(zone);
    if (!resolved) return { zone, source: false, valid: false };
    const clock = wallClockIn(instant, resolved);
    return {
      zone: resolved,
      source: resolved === source,
      valid: true,
      time: `${pad(clock.hour)}:${pad(clock.minute)}`,
      date: dateFormat(resolved).format(instant),
      dayDelta: dayNumber(instant, resolved) - sourceDay,
      offset: formatOffset(offsetOf(instant, resolved)),
      iso: isoInZone(instant, resolved),
    };
  });

  const unknown =
    locale === "tr" ? "bilinmeyen saat dilimi" : "unknown time zone";
  const width = Math.max(...rows.map((row) => row.zone.length));
  const text = rows
    .map((row) =>
      row.valid
        ? `${row.zone.padEnd(width)}  ${row.time}  ${row.date}  ${row.offset}`
        : `${row.zone.padEnd(width)}  ${unknown}`,
    )
    .join("\n");

  return {
    source,
    isoUtc: instant.toISOString(),
    isoSource: isoInZone(instant, source),
    unix: String(Math.floor(instant.getTime() / 1000)),
    rows,
    text,
  };
}

/** "2026-09-25 14:30" for this moment in `zone`, for the Now button. */
export function nowIn(zone: string, now = new Date()): string {
  const clock = wallClockIn(now, zone);
  return `${clock.year}-${pad(clock.month)}-${pad(clock.day)} ${pad(clock.hour)}:${pad(clock.minute)}`;
}
