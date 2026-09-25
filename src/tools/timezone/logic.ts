import type { Locale } from "@/i18n";
import { ToolError } from "../text-tool";

/**
 * One instant, in the zones a call actually gets scheduled across.
 *
 * The input is read *in a chosen zone* rather than in the browser's, because
 * the question is usually "the deploy window is 09:00 in Istanbul — what is
 * that in San Francisco", and typing a local time only to have it interpreted
 * as UTC is the mistake this is meant to prevent.
 */
const DEFAULT_ZONES = [
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

export function convertZones(
  input: string,
  sourceZone: string,
  extra: string,
  locale: Locale,
): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const instant = readInstant(trimmed, sourceZone);

  const zones = [
    ...new Set([
      sourceZone,
      ...extra
        .split(/[,\s]+/)
        .map((zone) => zone.trim())
        .filter(Boolean),
      ...DEFAULT_ZONES,
    ]),
  ];

  const width = Math.max(...zones.map((zone) => zone.length));
  return zones
    .map((zone) => {
      try {
        return `${zone.padEnd(width)}  ${formatIn(instant, zone, locale)}`;
      } catch {
        return `${zone.padEnd(width)}  ${locale === "tr" ? "bilinmeyen saat dilimi" : "unknown time zone"}`;
      }
    })
    .join("\n");
}

/**
 * Reads a wall-clock time as it would be read in `zone`.
 *
 * There is no platform API for this, so the instant is found by measuring how
 * far off the guess lands when formatted back in that zone and correcting —
 * twice, because the first correction can cross a DST boundary.
 */
export function readInstant(input: string, zone: string): Date {
  if (/^-?\d{9,}$/.test(input)) {
    const numeric = Number(input);
    return new Date(Math.abs(numeric) >= 1e11 ? numeric : numeric * 1000);
  }

  // A trailing Z or an explicit offset means the instant is already unambiguous.
  if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(input)) {
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) throw unreadable();
    return parsed;
  }

  const asUtc = new Date(`${input.replace(" ", "T")}Z`);
  if (Number.isNaN(asUtc.getTime())) throw unreadable();

  let guess = asUtc;
  for (let i = 0; i < 2; i += 1) {
    const offset = offsetOf(guess, zone);
    guess = new Date(asUtc.getTime() - offset);
  }
  return guess;
}

/** The zone's offset from UTC at that instant, in milliseconds. */
function offsetOf(date: Date, zone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "0" : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

function formatIn(date: Date, zone: string, locale: Locale): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: zone,
  }).format(date);

  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  return `${formatted}  ${name ?? ""}`.trimEnd();
}

function unreadable() {
  return new ToolError({
    tr: 'Tarih anlaşılmadı. "2026-09-25 14:30" ya da ISO 8601 bekleniyor.',
    en: 'Could not read the date. Try "2026-09-25 14:30" or ISO 8601.',
  });
}
