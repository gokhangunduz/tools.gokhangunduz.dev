import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "ip-geo",
  category: "network",
  icon: "network",
  name: { tr: "IP konumu ve ASN", en: "IP location and ASN" },
  blurb: {
    tr: "Bir adresin ülkesi, şehri, saat dilimi ve hangi ağa ait olduğu — boş bırakırsan kendi adresin.",
    en: "An address's country, city, time zone and network — leave it empty to see your own.",
  },
  keywords: {
    tr: ["ip", "konum", "coğrafi", "asn", "isp", "ülke", "kendi ip"],
    en: ["ip", "location", "geolocation", "asn", "isp", "country", "my ip"],
  },
  related: ["ip-convert", "dns-lookup"],
  network: true,
};
