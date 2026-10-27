import { ToolError } from "../text-tool";

export type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond?: number;
};

let cachedZones: string[] | null = null;

export function listZones(): string[] {
  if (cachedZones) return cachedZones;
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [];
  }
  cachedZones = ["UTC", ...zones.filter((zone) => zone !== "UTC")];
  return cachedZones;
}

export function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isZone(zone: string): boolean {
  if (!zone.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();
}

export function resolveZone(input: string): string | null {
  const typed = input.trim();
  if (!typed) return null;
  const wanted = fold(typed);
  const zones = listZones();
  const exact = zones.find((zone) => fold(zone) === wanted);
  if (exact) return exact;
  const city = zones.find(
    (zone) => fold(zone.split("/").pop() ?? "") === wanted,
  );
  if (city) return city;
  return isZone(typed) ? typed : null;
}

export function pickZone(input: string): string | null {
  const exact = resolveZone(input);
  if (exact) return exact;
  const wanted = fold(input.trim());
  if (!wanted) return null;
  const found = listZones().filter((zone) => fold(zone).includes(wanted));
  return found.length === 1 ? found[0] : null;
}

export function requireZone(input: string, field: string): string {
  const zone = resolveZone(input);
  if (zone) return zone;
  throw new ToolError(
    {
      tr: `"${input.trim()}" bilinen bir saat dilimi değil. Örn. Europe/Istanbul ya da UTC.`,
      en: `"${input.trim()}" is not a known time zone. Try Europe/Istanbul or UTC.`,
    },
    { field },
  );
}

export function wallClockIn(date: Date, zone: string): WallClock {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    millisecond: ((date.getTime() % 1000) + 1000) % 1000,
  };
}

function wallClockUtc(clock: WallClock): number {
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

export function offsetOf(date: Date, zone: string): number {
  const clock = wallClockIn(date, zone);
  return (
    wallClockUtc({ ...clock, millisecond: 0 }) -
    (date.getTime() - (clock.millisecond ?? 0))
  );
}

export function instantOf(clock: WallClock, zone: string): Date {
  const asUtc = wallClockUtc(clock);
  let guess = asUtc;
  for (let i = 0; i < 2; i += 1) {
    guess = asUtc - offsetOf(new Date(guess), zone);
  }
  return new Date(guess);
}

export function formatOffset(ms: number, { bare = false } = {}): string {
  if (ms === 0 && bare) return "UTC";
  const minutes = Math.round(Math.abs(ms) / 60_000);
  const sign = ms < 0 ? "−" : "+";
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `UTC${sign}${hh}:${mm}`;
}

export function isoInZone(date: Date, zone: string): string {
  const clock = wallClockIn(date, zone);
  const offset = offsetOf(date, zone);
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  const minutes = Math.round(Math.abs(offset) / 60_000);
  const suffix =
    offset === 0
      ? "Z"
      : `${offset < 0 ? "-" : "+"}${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  const year =
    clock.year < 0 || clock.year > 9999
      ? `${clock.year < 0 ? "-" : "+"}${pad(Math.abs(clock.year), 6)}`
      : pad(clock.year, 4);
  return `${year}-${pad(clock.month)}-${pad(clock.day)}T${pad(clock.hour)}:${pad(clock.minute)}:${pad(clock.second)}.${pad(clock.millisecond ?? 0, 3)}${suffix}`;
}
