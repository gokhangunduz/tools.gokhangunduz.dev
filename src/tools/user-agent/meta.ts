import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "user-agent",
  category: "network",
  icon: "network",
  name: { tr: "User-Agent ayrıştır", en: "User-Agent parser" },
  blurb: {
    tr: "Tarayıcı, motor, işletim sistemi ve cihaz — Chrome'u Safari sanmadan.",
    en: "Browser, engine, OS and device — without mistaking Chrome for Safari.",
  },
  keywords: {
    tr: ["user agent", "tarayıcı", "ua", "bot", "crawler", "cihaz"],
    en: ["user agent", "browser", "ua", "bot", "crawler", "device"],
  },
  related: ["http-status", "ip-geo"],
};
