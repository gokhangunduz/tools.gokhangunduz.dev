import type { Locale, Localized } from "@/i18n";
import { ToolError, type ResultRow, type TextResult } from "../text-tool";

/**
 * What an IPv4 CIDR block actually covers.
 *
 * The usable-host count is where this is worth more than arithmetic in your
 * head: IPv4 loses two addresses to the network and broadcast, /31 is a
 * point-to-point link with two usable addresses and no broadcast, and /32 is
 * one host. Getting that wrong is how a subnet ends up one address short.
 */
export type Cidr = {
  address: number;
  prefix: number;
  mask: number;
  network: number;
  broadcast: number;
  first: number;
  last: number;
  usable: number;
  total: number;
  type: Localized;
};

export function parseCidr(input: string): Cidr | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.includes(":")) {
    throw new ToolError({
      tr: "IPv6 henüz desteklenmiyor; yalnız IPv4.",
      en: "IPv6 is not supported yet; IPv4 only.",
    });
  }

  const match = /^(\S+?)(?:\s*\/\s*|\s+)(\S*)$/.exec(trimmed);
  const addressText = match ? match[1] : trimmed;
  const suffix = match ? match[2] : undefined;
  const address = toNumber(parseIpv4(addressText));

  let prefix = 32;
  if (suffix !== undefined) {
    if (suffix === "") {
      throw new ToolError({
        tr: "'/' sonrasına prefix uzunluğunu (0–32) ya da bir netmask yaz.",
        en: "Write the prefix length (0–32) or a netmask after the '/'.",
      });
    }
    prefix = suffix.includes(".") ? maskPrefix(suffix) : prefixLength(suffix);
  }

  const mask = prefix === 0 ? 0 : (0xffff_ffff << (32 - prefix)) >>> 0;
  const network = (address & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  const usable =
    prefix === 32
      ? { first: network, last: network, count: 1 }
      : prefix === 31
        ? { first: network, last: broadcast, count: 2 }
        : { first: network + 1, last: broadcast - 1, count: total - 2 };

  return {
    address,
    prefix,
    mask,
    network,
    broadcast,
    first: usable.first,
    last: usable.last,
    usable: usable.count,
    total,
    type: classify(network, broadcast),
  };
}

function prefixLength(text: string): number {
  if (!/^\d{1,2}$/.test(text) || Number(text) > 32) {
    throw new ToolError({
      tr: "Prefix uzunluğu 0 ile 32 arasında bir sayı olmalı.",
      en: "The prefix length must be a number between 0 and 32.",
    });
  }
  return Number(text);
}

/** A dotted netmask to its prefix length, provided its one-bits are contiguous. */
export function maskPrefix(text: string): number {
  const mask = toNumber(parseIpv4(text));
  const hostBits = ~mask >>> 0;
  if ((hostBits & (hostBits + 1)) !== 0) {
    throw new ToolError({
      tr: `${text} geçerli bir netmask değil; bitleri soldan kesintisiz 1 olmalı.`,
      en: `${text} is not a valid netmask; its one-bits must be contiguous from the left.`,
    });
  }
  return 32 - Math.log2(hostBits + 1);
}

export function parseIpv4(address: string): number[] {
  const parts = address.trim().split(".");
  if (parts.length !== 4) {
    throw new ToolError({
      tr: "IPv4 adresi dört parçadan oluşur (örn. 10.0.0.1/24).",
      en: "An IPv4 address has four parts (e.g. 10.0.0.1/24).",
    });
  }

  return parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      throw new ToolError({
        tr: `"${part}" bir sayı değil.`,
        en: `"${part}" is not a number.`,
      });
    }
    const octet = Number(part);
    if (octet > 255) {
      throw new ToolError({
        tr: `${octet} 255'ten büyük.`,
        en: `${octet} is greater than 255.`,
      });
    }
    return octet;
  });
}

function toNumber(octets: number[]): number {
  return octets.reduce((total, octet) => total * 256 + octet, 0);
}

export function format(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 0xff).join(".");
}

function binary(value: number): string {
  return [24, 16, 8, 0]
    .map((shift) => ((value >>> shift) & 0xff).toString(2).padStart(8, "0"))
    .join(".");
}

const RANGES: [string, number, Localized][] = [
  ["255.255.255.255", 32, { tr: "limited broadcast", en: "limited broadcast" }],
  ["0.0.0.0", 8, { tr: "bu ağ (RFC 1122)", en: "this network (RFC 1122)" }],
  ["10.0.0.0", 8, { tr: "özel (RFC 1918)", en: "private (RFC 1918)" }],
  ["172.16.0.0", 12, { tr: "özel (RFC 1918)", en: "private (RFC 1918)" }],
  ["192.168.0.0", 16, { tr: "özel (RFC 1918)", en: "private (RFC 1918)" }],
  ["100.64.0.0", 10, { tr: "CGNAT (RFC 6598)", en: "CGNAT (RFC 6598)" }],
  ["127.0.0.0", 8, { tr: "loopback", en: "loopback" }],
  ["169.254.0.0", 16, { tr: "link-local", en: "link-local" }],
  [
    "192.0.2.0",
    24,
    { tr: "dokümantasyon (TEST-NET-1)", en: "documentation (TEST-NET-1)" },
  ],
  [
    "198.51.100.0",
    24,
    { tr: "dokümantasyon (TEST-NET-2)", en: "documentation (TEST-NET-2)" },
  ],
  [
    "203.0.113.0",
    24,
    { tr: "dokümantasyon (TEST-NET-3)", en: "documentation (TEST-NET-3)" },
  ],
  [
    "198.18.0.0",
    15,
    { tr: "benchmark (RFC 2544)", en: "benchmark (RFC 2544)" },
  ],
  ["224.0.0.0", 4, { tr: "multicast", en: "multicast" }],
  ["240.0.0.0", 4, { tr: "ayrılmış", en: "reserved" }],
];

const PUBLIC: Localized = { tr: "genel", en: "public" };

function kind(value: number): Localized {
  for (const [base, prefix, label] of RANGES) {
    const mask = (0xffff_ffff << (32 - prefix)) >>> 0;
    if ((value & mask) >>> 0 === toNumber(parseIpv4(base))) return label;
  }
  return PUBLIC;
}

/** RFC 1918 and friends, checked at both ends so a block that straddles two says so. */
export function classify(network: number, broadcast: number): Localized {
  const start = kind(network);
  const end = kind(broadcast);
  if (start.en === end.en) return start;
  return {
    tr: `karma (${start.tr} … ${end.tr})`,
    en: `mixed (${start.en} … ${end.en})`,
  };
}

export function describeCidr(input: string, locale: Locale): TextResult {
  const cidr = parseCidr(input);
  if (!cidr) return { text: "" };

  const n = (value: number) => value.toLocaleString(locale);
  const row = (tr: string, en: string, value: string): ResultRow => ({
    label: { tr, en },
    value,
  });
  const noBroadcast = cidr.prefix >= 31;

  const rows = [
    row("CIDR", "CIDR", `${format(cidr.network)}/${cidr.prefix}`),
    row("Kullanılabilir host", "Usable hosts", n(cidr.usable)),
    row("Tür", "Type", cidr.type[locale]),
  ];
  const addresses = [
    row("Ağ adresi", "Network", format(cidr.network)),
    row("Broadcast", "Broadcast", noBroadcast ? "—" : format(cidr.broadcast)),
    row("İlk host", "First host", format(cidr.first)),
    row("Son host", "Last host", format(cidr.last)),
    row("Toplam adres", "Total addresses", n(cidr.total)),
  ];
  const masks = [
    row("Netmask", "Netmask", format(cidr.mask)),
    row("Wildcard", "Wildcard", format(~cidr.mask >>> 0)),
    row("Binary maske", "Binary mask", binary(cidr.mask)),
  ];

  const all = [...rows, ...addresses, ...masks];
  const labels = all.map((r) => (r.label as Localized)[locale]);
  const width = Math.max(...labels.map((label) => label.length));
  const text = all
    .map((r, i) => `${labels[i].padEnd(width)}  ${r.value}`)
    .join("\n");

  return {
    text,
    rows,
    groups: [
      { label: { tr: "Adresler", en: "Addresses" }, rows: addresses },
      { label: { tr: "Maske", en: "Mask" }, rows: masks },
    ],
  };
}

/** Said out loud when the address typed is inside the block rather than its start. */
export function hostNote(input: string): Localized | null {
  const cidr = parseCidr(input);
  if (!cidr || cidr.prefix >= 31 || cidr.address === cidr.network) return null;
  const address = format(cidr.address);
  const block = `${format(cidr.network)}/${cidr.prefix}`;
  return {
    tr: `${address} bir host adresi; blok ${block}`,
    en: `${address} is a host address; the block is ${block}`,
  };
}
