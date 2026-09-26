import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "timezone",
  category: "time",
  icon: "globe",
  name: { tr: "Saat dilimi çevir", en: "Time zone converter" },
  blurb: {
    tr: "Yazdığın saati seçtiğin dilimde okur — yaz saati farkları dahil — ve her yerdeki karşılığını verir.",
    en: "Reads your time in the zone you name, DST included, and shows it everywhere else.",
  },
  keywords: {
    tr: ["saat dilimi", "timezone", "utc", "gmt", "dst", "toplantı", "çevir"],
    en: ["time zone", "timezone", "utc", "gmt", "dst", "meeting", "convert"],
  },
};
