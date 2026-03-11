import { ToolError } from "../text-tool";

/**
 * What a CIDR block actually covers.
 *
 * The usable-host count is where this is worth more than arithmetic in your
 * head: IPv4 loses two addresses to the network and broadcast, /31 is a
 * point-to-point link with two usable addresses and no broadcast, and /32 is
 * one host. Getting that wrong is how a subnet ends up one address short.
 */
export function describeCidr(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const [address, prefixText] = trimmed.split("/");
  const octets = parseIpv4(address);
  const prefix = prefixText === undefined ? 32 : Number(prefixText);

  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new ToolError({
      tr: "Önek uzunluğu 0 ile 32 arasında olmalı.",
      en: "The prefix length must be between 0 and 32.",
    });
  }

  const value = octets.reduce((total, octet) => total * 256 + octet, 0);
  const mask = prefix === 0 ? 0 : (0xffff_ffff << (32 - prefix)) >>> 0;
  const network = (value & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);

  const usable =
    prefix === 32
      ? { first: network, last: network, count: 1 }
      : prefix === 31
        ? { first: network, last: broadcast, count: 2 }
        : { first: network + 1, last: broadcast - 1, count: total - 2 };

  const rows: [string, string][] = [
    ["CIDR", `${format(network)}/${prefix}`],
    ["netmask", format(mask)],
    ["wildcard", format(~mask >>> 0)],
    ["network", format(network)],
    ["broadcast", prefix >= 31 ? "—" : format(broadcast)],
    ["first host", format(usable.first)],
    ["last host", format(usable.last)],
    ["hosts", usable.count.toLocaleString("en-US").replace(/,/g, " ")],
    ["total", total.toLocaleString("en-US").replace(/,/g, " ")],
    ["binary mask", binary(mask)],
    ["type", classify(network)],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, text]) => `${label.padEnd(width)}  ${text}`)
    .join("\n");
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

function format(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 0xff).join(".");
}

function binary(value: number): string {
  return [24, 16, 8, 0]
    .map((shift) => ((value >>> shift) & 0xff).toString(2).padStart(8, "0"))
    .join(".");
}

/** RFC 1918 and friends, because "is this private" is half the question. */
function classify(network: number): string {
  const first = (network >>> 24) & 0xff;
  const second = (network >>> 16) & 0xff;

  if (first === 10) return "private (RFC 1918)";
  if (first === 172 && second >= 16 && second <= 31)
    return "private (RFC 1918)";
  if (first === 192 && second === 168) return "private (RFC 1918)";
  if (first === 127) return "loopback";
  if (first === 169 && second === 254) return "link-local";
  if (first === 100 && second >= 64 && second <= 127) return "CGNAT (RFC 6598)";
  if (first >= 224 && first <= 239) return "multicast";
  if (first >= 240) return "reserved";
  return "public";
}
