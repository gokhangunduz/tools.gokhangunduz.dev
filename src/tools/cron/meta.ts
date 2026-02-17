import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "cron",
  category: "time",
  icon: "calendarClock",
  name: { tr: "Cron ifadesi açıkla", en: "Explain a cron expression" },
  blurb: {
    tr: "İfadeyi Türkçe cümleye çevirir ve seçtiğin saat diliminde sonraki çalışmaları listeler.",
    en: "Turns the expression into a sentence and lists the next runs in your time zone.",
  },
  keywords: {
    tr: ["cron", "crontab", "zamanlama", "schedule", "görev", "açıkla"],
    en: ["cron", "crontab", "schedule", "job", "explain", "next run"],
  },
  related: ["timestamp", "duration"],
};
