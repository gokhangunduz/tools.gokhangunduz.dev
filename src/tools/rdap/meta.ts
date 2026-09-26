import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "rdap",
  category: "network",
  icon: "scanSearch",
  name: { tr: "WHOIS / RDAP sorgula", en: "WHOIS / RDAP lookup" },
  blurb: {
    tr: "Alan adının registrar'ı, kayıt ve bitiş tarihleri, nameserver'ları ve DNSSEC durumu — RDAP üzerinden.",
    en: "A domain's registrar, registration and expiry dates, nameservers and DNSSEC, over RDAP.",
  },
  keywords: {
    tr: [
      "whois",
      "rdap",
      "alan adı",
      "domain",
      "kayıt",
      "bitiş tarihi",
      "registrar",
      "nameserver",
      "dnssec",
      "abuse",
    ],
    en: [
      "whois",
      "rdap",
      "domain",
      "registration",
      "expiry",
      "registrar",
      "nameserver",
      "dnssec",
      "abuse",
    ],
  },
  network: true,
  networkService: "rdap.org",
};
