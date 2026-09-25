import { ToolError } from "../text-tool";

/**
 * What an availability figure costs in minutes.
 *
 * "Three nines" is a number nobody has an intuition for; 8 hours and 46
 * minutes a year is one. The table runs both ways, so a downtime budget can
 * be read off directly.
 */
export function describeSla(input: string): string {
  const trimmed = input.trim().replace(",", ".").replace(/%/g, "");
  if (!trimmed) return "";

  const percent = Number(trimmed);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    throw new ToolError({
      tr: "0 ile 100 arasında bir yüzde girilmeli (örn. 99.9).",
      en: "Enter a percentage between 0 and 100 (e.g. 99.9).",
    });
  }

  const fraction = (100 - percent) / 100;
  const periods: [string, number][] = [
    ["gün / day", 86_400],
    ["hafta / week", 604_800],
    ["ay (30 gün) / month", 2_592_000],
    ["çeyrek / quarter", 7_776_000],
    ["yıl / year", 31_536_000],
  ];

  const rows = periods.map(([label, seconds]) => [
    label,
    humanize(seconds * fraction),
  ]);

  const width = Math.max(...rows.map(([label]) => label.length));
  return [
    `${percent}% → kesinti bütçesi / downtime budget`,
    "",
    ...rows.map(([label, value]) => `${label.padEnd(width)}  ${value}`),
  ].join("\n");
}

function humanize(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} sn / s`;
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} dk ${Math.round(seconds % 60)} sn`;
  }
  if (seconds < 86_400) {
    return `${Math.floor(seconds / 3600)} sa ${Math.round((seconds % 3600) / 60)} dk`;
  }
  const days = Math.floor(seconds / 86_400);
  const hours = Math.round((seconds % 86_400) / 3600);
  return `${days} gün ${hours} sa / ${days} d ${hours} h`;
}
