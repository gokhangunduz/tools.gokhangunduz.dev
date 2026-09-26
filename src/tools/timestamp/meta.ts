import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "timestamp",
  category: "time",
  icon: "clock",
  name: { tr: "Timestamp converter", en: "Timestamp converter" },
  blurb: {
    tr: "Saniye mi milisaniye mi olduğunu kendi anlar; ISO, RFC, yerel saat ve göreli zamanı birlikte verir.",
    en: "Works out seconds from milliseconds on its own, then prints ISO, RFC, local and relative time.",
  },
  keywords: {
    tr: [
      "unix",
      "timestamp",
      "epoch",
      "tarih",
      "iso",
      "zaman",
      "zaman damgası",
    ],
    en: ["unix", "timestamp", "epoch", "date", "iso", "time", "convert"],
  },
};
