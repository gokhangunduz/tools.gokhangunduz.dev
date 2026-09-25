import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "rdap",
  category: "network",
  icon: "network",
  name: { tr: "WHOIS / RDAP sorgula", en: "WHOIS / RDAP lookup" },
  blurb: {
    tr: "Alan adının kayıt tarihi, bitiş tarihi, kayıt kuruluşu ve ad sunucuları — RDAP üzerinden.",
    en: "A domain's registration and expiry dates, its registrar and nameservers, over RDAP.",
  },
  keywords: {
    tr: ["whois", "rdap", "alan adı", "domain", "kayıt", "bitiş", "registrar"],
    en: ["whois", "rdap", "domain", "registration", "expiry", "registrar"],
  },
  related: ["dns-lookup", "ip-geo"],
  network: true,
};
