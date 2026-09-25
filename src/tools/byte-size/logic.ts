import { ToolError } from "../text-tool";

/**
 * Byte sizes in both conventions, which is the whole point.
 *
 * A "1 TB" disk holds 931 GiB, and the two numbers are both correct — decimal
 * for storage and network, binary for memory and file sizes as most operating
 * systems report them. Printing both side by side is what makes a mismatch
 * make sense instead of looking like a missing 7%.
 */
const DECIMAL = ["B", "kB", "MB", "GB", "TB", "PB"];
const BINARY = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];

const MULTIPLIERS: Record<string, number> = {
  b: 1 / 8,
  bit: 1 / 8,
  bits: 1 / 8,
  byte: 1,
  bytes: 1,
  bayt: 1,
  kb: 1e3,
  mb: 1e6,
  gb: 1e9,
  tb: 1e12,
  pb: 1e15,
  kib: 1024,
  mib: 1024 ** 2,
  gib: 1024 ** 3,
  tib: 1024 ** 4,
  pib: 1024 ** 5,
  k: 1e3,
  m: 1e6,
  g: 1e9,
  t: 1e12,
};

export function parseSize(input: string): number {
  const trimmed = input.trim().toLowerCase().replace(/,/g, ".");
  if (!trimmed) throw new ToolError({ tr: "Boş.", en: "Empty." });

  const match = /^(-?\d+(?:\.\d+)?)\s*([a-zıi]*)$/.exec(trimmed);
  if (!match) {
    throw new ToolError({
      tr: 'Boyut anlaşılmadı. "1536", "1.5 MB" ya da "2 GiB" gibi yazılmalı.',
      en: 'Could not read the size. Write it like "1536", "1.5 MB" or "2 GiB".',
    });
  }

  const [, amount, unit] = match;
  if (!unit) return Number(amount);

  const multiplier = MULTIPLIERS[unit];
  if (multiplier === undefined) {
    throw new ToolError({
      tr: `Bilinmeyen birim: ${unit}`,
      en: `Unknown unit: ${unit}`,
    });
  }
  return Number(amount) * multiplier;
}

export function describeSize(input: string): string {
  const bytes = parseSize(input);

  const rows: [string, string][] = [
    ["bytes", format(bytes)],
    ["bits", format(bytes * 8)],
    ["decimal (kB, MB…)", scale(bytes, 1000, DECIMAL)],
    ["binary (KiB, MiB…)", scale(bytes, 1024, BINARY)],
  ];

  // The transfer times are the other half of the question a size prompts.
  for (const [label, mbps] of [
    ["100 Mbit/s", 100],
    ["1 Gbit/s", 1000],
  ] as const) {
    const seconds = (bytes * 8) / (mbps * 1e6);
    rows.push([`@ ${label}`, duration(seconds)]);
  }

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, value]) => `${label.padEnd(width)}  ${value}`)
    .join("\n");
}

function scale(bytes: number, base: number, units: string[]): string {
  const magnitude = Math.abs(bytes);
  if (magnitude < base) return `${format(bytes)} ${units[0]}`;

  const index = Math.min(
    Math.floor(Math.log(magnitude) / Math.log(base)),
    units.length - 1,
  );
  const value = bytes / base ** index;
  return `${value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0)} ${units[index]}`;
}

function format(value: number): string {
  return Number.isInteger(value)
    ? value.toLocaleString("en-US").replace(/,/g, " ")
    : value.toFixed(2);
}

function duration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)} m ${Math.round(seconds % 60)} s`;
  return `${(seconds / 3600).toFixed(1)} h`;
}
