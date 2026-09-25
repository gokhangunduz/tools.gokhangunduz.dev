import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "cidr",
  category: "network",
  icon: "network",
  name: { tr: "CIDR / alt ağ hesapla", en: "CIDR / subnet calculator" },
  blurb: {
    tr: "Ağ, yayın, ilk ve son adres, kullanılabilir host sayısı — /31 ve /32 dahil doğru sayar.",
    en: "Network, broadcast, first and last address and the usable host count, /31 and /32 included.",
  },
  keywords: {
    tr: ["cidr", "subnet", "alt ağ", "netmask", "ip", "ağ", "maske"],
    en: ["cidr", "subnet", "netmask", "ip", "network", "mask", "hosts"],
  },
  related: ["ip-convert", "dns-lookup"],
};
