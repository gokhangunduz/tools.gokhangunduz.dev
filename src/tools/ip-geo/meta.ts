import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "ip-geo",
  category: "network",
  icon: "mapPin",
  name: { tr: "IP konumu ve ASN", en: "IP location and ASN" },
  blurb: {
    tr: "Bir adresin ülkesi, şehri, saat dilimi ve hangi ağa ait olduğu — boş bırakırsan kendi adresin.",
    en: "An address's country, city, time zone and network — leave it empty to see your own.",
  },
  keywords: {
    tr: [
      "ip",
      "konum",
      "location",
      "coğrafi",
      "geolocation",
      "asn",
      "isp",
      "ülke",
      "kendi ip",
      "my ip",
    ],
    en: ["ip", "location", "geolocation", "asn", "isp", "country", "my ip"],
  },
  network: true,
  networkService: "ipwho.is",
};
