import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "cidr",
  category: "network",
  icon: "network",
  name: {
    tr: "IPv4 CIDR / subnet hesapla",
    en: "IPv4 CIDR / subnet calculator",
  },
  blurb: {
    tr: "IPv4 bloğunun ağ adresi, broadcast, ilk ve son host ve kullanılabilir host sayısı; /31 ve /32 dahil doğru sayar.",
    en: "An IPv4 block's network, broadcast, first and last host and usable host count, /31 and /32 included.",
  },
  keywords: {
    tr: ["cidr", "subnet", "alt ağ", "netmask", "ip", "ağ", "maske"],
    en: ["cidr", "subnet", "netmask", "ip", "network", "mask", "hosts"],
  },
};
