import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "dns-lookup",
  category: "network",
  icon: "server",
  name: { tr: "DNS sorgula", en: "DNS lookup" },
  blurb: {
    tr: "A, MX, TXT ve diğerleri — doğrudan tarayıcıdan, Cloudflare'ın DNS-over-HTTPS resolver'ından.",
    en: "A, MX, TXT and the rest, straight from Cloudflare's DNS-over-HTTPS resolver.",
  },
  keywords: {
    tr: [
      "dns",
      "sorgu",
      "lookup",
      "a kaydı",
      "a record",
      "mx",
      "txt",
      "nameserver",
      "resolver",
      "doh",
      "dig",
    ],
    en: ["dns", "lookup", "a record", "mx", "txt", "nameserver", "doh", "dig"],
  },
  network: true,
  networkService: "cloudflare-dns.com",
};
