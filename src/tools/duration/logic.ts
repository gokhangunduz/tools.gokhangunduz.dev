import type { Locale } from "@/i18n";
import { ToolError } from "../text-tool";

/**
 * A duration in every unit it might be needed in, from whatever was typed.
 *
 * Both directions in one box: "90000" is read as milliseconds by default and
 * "1h 30m" as what it says, so the tool answers whether the input came from a
 * log line or from a config file.
 */
const UNITS: [RegExp, number][] = [
  [/(\d+(?:\.\d+)?)\s*(?:ms|milisaniye|milliseconds?)/gi, 1],
  [/(\d+(?:\.\d+)?)\s*(?:s|sn|saniye|seconds?|sec)\b/gi, 1000],
  [/(\d+(?:\.\d+)?)\s*(?:m|dk|dakika|minutes?|min)\b/gi, 60_000],
  [/(\d+(?:\.\d+)?)\s*(?:h|sa|saat|hours?|hr)\b/gi, 3_600_000],
  [/(\d+(?:\.\d+)?)\s*(?:d|g|gün|days?)\b/gi, 86_400_000],
  [/(\d+(?:\.\d+)?)\s*(?:w|hafta|weeks?)\b/gi, 604_800_000],
];

export type InputUnit = "ms" | "s" | "m" | "h" | "d";

const SCALE: Record<InputUnit, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function toMilliseconds(input: string, unit: InputUnit): number {
  const trimmed = input.trim();
  if (!trimmed) throw new ToolError({ tr: "Boş.", en: "Empty." });

  // A bare number takes the selected unit; anything with letters is read as
  // a compound duration.
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed) * SCALE[unit];
  }

  let total = 0;
  let matched = false;
  for (const [pattern, scale] of UNITS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(trimmed)) !== null) {
      total += Number(match[1]) * scale;
      matched = true;
    }
  }

  if (!matched) {
    throw new ToolError({
      tr: 'Süre anlaşılmadı. "90000", "1h 30m" ya da "2 gün" gibi yazılmalı.',
      en: 'Could not read the duration. Write it like "90000", "1h 30m" or "2 days".',
    });
  }
  return total;
}

export function describeDuration(
  input: string,
  unit: InputUnit,
  locale: Locale,
): string {
  const ms = toMilliseconds(input, unit);

  const rows: [string, string][] = [
    ["ms", format(ms)],
    [locale === "tr" ? "saniye" : "seconds", format(ms / 1000)],
    [locale === "tr" ? "dakika" : "minutes", format(ms / 60_000)],
    [locale === "tr" ? "saat" : "hours", format(ms / 3_600_000)],
    [locale === "tr" ? "gün" : "days", format(ms / 86_400_000)],
    [locale === "tr" ? "hafta" : "weeks", format(ms / 604_800_000)],
    [locale === "tr" ? "okunur" : "human", human(ms, locale)],
    ["ISO 8601", iso(ms)],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, value]) => `${label.padEnd(width)}  ${value}`)
    .join("\n");
}

function format(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/\.?0+$/, "");
}

/** "1 gün 2 sa 3 dk" — the form a person reads off a dashboard. */
export function human(ms: number, locale: Locale): string {
  const negative = ms < 0;
  let remaining = Math.abs(ms);

  const parts: string[] = [];
  const steps: [number, string, string][] = [
    [86_400_000, "gün", "d"],
    [3_600_000, "sa", "h"],
    [60_000, "dk", "m"],
    [1000, "sn", "s"],
    [1, "ms", "ms"],
  ];

  for (const [size, tr, en] of steps) {
    const amount = Math.floor(remaining / size);
    if (amount > 0) {
      parts.push(`${amount} ${locale === "tr" ? tr : en}`);
      remaining -= amount * size;
    }
  }

  if (parts.length === 0) return locale === "tr" ? "0 ms" : "0 ms";
  return (negative ? "-" : "") + parts.slice(0, 3).join(" ");
}

/** The form a Kubernetes manifest or an ISO field wants. */
function iso(ms: number): string {
  const totalSeconds = Math.abs(ms) / 1000;
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const date = days > 0 ? `${days}D` : "";
  const time = [
    hours > 0 ? `${hours}H` : "",
    minutes > 0 ? `${minutes}M` : "",
    seconds > 0 ? `${format(seconds)}S` : "",
  ].join("");

  if (!date && !time) return "PT0S";
  return `${ms < 0 ? "-" : ""}P${date}${time ? `T${time}` : ""}`;
}
