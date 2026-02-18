import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "duration",
  category: "time",
  icon: "calendarClock",
  name: { tr: "Süre çevir", en: "Duration converter" },
  blurb: {
    tr: '"5400000" ya da "1h 30m" — her iki yönde okur, ISO 8601 süresini de verir.',
    en: '"5400000" or "1h 30m" — read either way, with the ISO 8601 duration too.',
  },
  keywords: {
    tr: ["süre", "ms", "milisaniye", "dakika", "saat", "iso 8601", "çevir"],
    en: [
      "duration",
      "ms",
      "milliseconds",
      "minutes",
      "hours",
      "iso 8601",
      "convert",
    ],
  },
  related: ["timestamp", "cron"],
};
