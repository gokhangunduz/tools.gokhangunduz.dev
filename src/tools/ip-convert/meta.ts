import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "ip-convert",
  category: "network",
  icon: "network",
  name: { tr: "IP adresi çevir", en: "IP address converter" },
  blurb: {
    tr: "Noktalı gösterim, tam sayı, hex, IPv6 eşlemesi ve ters DNS adı — hepsi bir arada.",
    en: "Dotted form, integer, hex, the IPv6-mapped form and the reverse DNS name, together.",
  },
  keywords: {
    tr: ["ip", "ipv4", "ipv6", "tam sayı", "hex", "çevir", "arpa", "ters dns"],
    en: [
      "ip",
      "ipv4",
      "ipv6",
      "integer",
      "hex",
      "convert",
      "arpa",
      "reverse dns",
    ],
  },
  related: ["cidr", "ip-geo"],
};
