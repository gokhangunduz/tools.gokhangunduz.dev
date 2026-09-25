import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "sla-uptime",
  category: "time",
  icon: "calendarClock",
  name: { tr: "SLA kesinti bütçesi", en: "SLA downtime budget" },
  blurb: {
    tr: "%99.9 yılda 8 saat 46 dakika demek — yüzdeyi dakikaya çevirir.",
    en: "99.9% means 8 hours 46 minutes a year — turns the percentage into minutes.",
  },
  keywords: {
    tr: ["sla", "uptime", "kesinti", "erişilebilirlik", "dokuz", "bütçe"],
    en: ["sla", "uptime", "downtime", "availability", "nines", "budget"],
  },
  related: ["duration", "timestamp"],
};
