import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "dns-lookup",
  category: "network",
  icon: "network",
  name: { tr: "DNS sorgula", en: "DNS lookup" },
  blurb: {
    tr: "A, MX, TXT ve diğerleri — Cloudflare'ın DNS-over-HTTPS çözümleyicisinden, tarayıcıdan.",
    en: "A, MX, TXT and the rest, straight from Cloudflare's DNS-over-HTTPS resolver.",
  },
  keywords: {
    tr: ["dns", "sorgu", "a kaydı", "mx", "txt", "nameserver", "doh", "dig"],
    en: ["dns", "lookup", "a record", "mx", "txt", "nameserver", "doh", "dig"],
  },
  related: ["rdap", "cidr"],
  network: true,
};
