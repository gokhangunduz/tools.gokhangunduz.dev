import { ToolError } from "../text-tool";
import { parseIpv4 } from "../cidr/logic";

/**
 * An address in every notation a log, a config or a database column uses.
 *
 * The integer form is the one worth having: an IP stored as a number in a
 * table is unreadable, and converting it back by hand is four divisions.
 */
export function describeAddress(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const value = readAddress(trimmed);

  const dotted = [24, 16, 8, 0].map((shift) => (value >>> shift) & 0xff);
  const hex = value.toString(16).padStart(8, "0");

  const rows: [string, string][] = [
    ["IPv4", dotted.join(".")],
    ["integer", String(value >>> 0)],
    ["hex", `0x${hex}`],
    ["octal", dotted.map((octet) => `0${octet.toString(8)}`).join(".")],
    [
      "binary",
      dotted.map((octet) => octet.toString(2).padStart(8, "0")).join("."),
    ],
    ["IPv6 mapped", `::ffff:${dotted.join(".")}`],
    ["IPv6 hex", `::ffff:${hex.slice(0, 4)}:${hex.slice(4)}`],
    ["ip6.arpa", arpa(hex)],
    ["in-addr.arpa", `${[...dotted].reverse().join(".")}.in-addr.arpa`],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, text]) => `${label.padEnd(width)}  ${text}`)
    .join("\n");
}

function readAddress(input: string): number {
  if (input.includes(".") && !input.startsWith("::")) {
    const octets = parseIpv4(input);
    return octets.reduce((total, octet) => total * 256 + octet, 0);
  }

  // The IPv4-mapped form, as a proxy or a dual-stack socket logs it.
  const mapped = /^::ffff:(.+)$/i.exec(input);
  if (mapped) {
    if (mapped[1].includes(".")) {
      return parseIpv4(mapped[1]).reduce(
        (total, octet) => total * 256 + octet,
        0,
      );
    }
    const hex = mapped[1].replace(":", "");
    return parseInt(hex, 16);
  }

  if (/^0x[0-9a-f]+$/i.test(input)) return parseInt(input.slice(2), 16);
  if (/^\d+$/.test(input)) {
    const value = Number(input);
    if (value > 0xffff_ffff) {
      throw new ToolError({
        tr: "Sayı 32 bitlik IPv4 aralığının dışında.",
        en: "That number is outside the 32-bit IPv4 range.",
      });
    }
    return value;
  }

  throw new ToolError({
    tr: "Adres anlaşılmadı. 10.0.0.1, 167772161, 0x0a000001 ya da ::ffff:10.0.0.1 bekleniyor.",
    en: "Could not read the address. Try 10.0.0.1, 167772161, 0x0a000001 or ::ffff:10.0.0.1.",
  });
}

function arpa(hex: string): string {
  return `${[...hex].reverse().join(".")}.f.f.f.f.ip6.arpa`;
}
