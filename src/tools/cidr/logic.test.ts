import { describe, expect, it } from "vitest";
import { describeCidr, hostNote, maskPrefix, parseCidr } from "./logic";
import type { Localized } from "@/i18n";

function value(input: string, label: string, locale: "tr" | "en" = "en") {
  const result = describeCidr(input, locale);
  const rows = [
    ...(result.rows ?? []),
    ...(result.groups ?? []).flatMap((group) => group.rows),
  ];
  return rows.find((row) => (row.label as Localized)[locale] === label)!.value;
}

const type = (input: string) => parseCidr(input)!.type.en;

describe("describeCidr", () => {
  it("computes a /24", () => {
    const input = "192.168.1.130/24";
    expect(value(input, "CIDR")).toBe("192.168.1.0/24");
    expect(value(input, "Netmask")).toBe("255.255.255.0");
    expect(value(input, "Wildcard")).toBe("0.0.0.255");
    expect(value(input, "Broadcast")).toBe("192.168.1.255");
    expect(value(input, "First host")).toBe("192.168.1.1");
    expect(value(input, "Last host")).toBe("192.168.1.254");
    expect(value(input, "Usable hosts")).toBe("254");
  });

  it("treats /31 as a point-to-point link with two usable addresses", () => {
    expect(value("10.0.0.0/31", "Usable hosts")).toBe("2");
    expect(value("10.0.0.0/31", "Broadcast")).toBe("—");
  });

  it("treats /32 as a single host", () => {
    expect(value("10.0.0.5/32", "Usable hosts")).toBe("1");
  });

  it("formats large counts for the page's language", () => {
    expect(value("10.0.0.0/8", "Usable hosts", "en")).toBe("16,777,214");
    expect(value("10.0.0.0/8", "Kullanılabilir host", "tr")).toBe("16.777.214");
  });

  it("labels rows in Turkish", () => {
    expect(value("192.168.1.0/24", "Ağ adresi", "tr")).toBe("192.168.1.0");
    expect(value("192.168.1.0/24", "Tür", "tr")).toBe("özel (RFC 1918)");
  });

  it("puts the labelled values in the copied text", () => {
    const { text } = describeCidr("192.168.1.0/24", "en");
    expect(text).toMatch(/^CIDR\s+192\.168\.1\.0\/24$/m);
    expect(text).toMatch(
      /^Binary mask\s+11111111\.11111111\.11111111\.00000000$/m,
    );
  });

  it("assumes /32 when no prefix is given", () => {
    expect(value("8.8.8.8", "CIDR")).toBe("8.8.8.8/32");
  });

  it("accepts a dotted netmask after a slash or a space", () => {
    expect(value("192.168.1.9/255.255.255.0", "CIDR")).toBe("192.168.1.0/24");
    expect(value("192.168.1.9 255.255.252.0", "CIDR")).toBe("192.168.0.0/22");
    expect(maskPrefix("0.0.0.0")).toBe(0);
    expect(maskPrefix("255.255.255.255")).toBe(32);
  });

  it("refuses a netmask whose bits are not contiguous", () => {
    expect(() => maskPrefix("255.0.255.0")).toThrow(/netmask/);
    expect(() => describeCidr("10.0.0.1 255.255.255.1", "en")).toThrow();
  });

  it("does not read an empty prefix as /0", () => {
    expect(() => describeCidr("10.0.0.1/", "en")).toThrow(/prefix/);
  });

  it("says IPv6 is not supported rather than calling it malformed", () => {
    expect(() => describeCidr("2001:db8::/32", "en")).toThrow(/IPv6/);
  });

  it("rejects a malformed address or prefix", () => {
    expect(() => describeCidr("10.0.0", "en")).toThrow();
    expect(() => describeCidr("10.0.0.256/24", "en")).toThrow();
    expect(() => describeCidr("10.0.0.1/33", "en")).toThrow();
    expect(() => describeCidr("10.0.0.1/1a", "en")).toThrow();
    expect(() => describeCidr("10.0.0.1/024", "en")).toThrow();
  });

  it("returns empty for blank input", () => {
    expect(describeCidr("  ", "en")).toEqual({ text: "" });
  });
});

describe("classify", () => {
  it("recognises the special ranges", () => {
    expect(type("10.1.2.3/24")).toContain("private");
    expect(type("172.16.0.1/24")).toContain("private");
    expect(type("172.32.0.1/24")).toBe("public");
    expect(type("127.0.0.1/8")).toBe("loopback");
    expect(type("100.64.0.1/10")).toContain("CGNAT");
    expect(type("0.0.0.0/8")).toContain("this network");
    expect(type("192.0.2.10/24")).toContain("TEST-NET-1");
    expect(type("198.51.100.1/24")).toContain("TEST-NET-2");
    expect(type("203.0.113.1/24")).toContain("TEST-NET-3");
    expect(type("198.19.0.1/16")).toContain("benchmark");
    expect(type("255.255.255.255")).toBe("limited broadcast");
    expect(type("240.0.0.1/8")).toBe("reserved");
  });

  it("checks both ends of the block", () => {
    expect(type("10.0.0.0/7")).toMatch(/^mixed \(private .* public\)$/);
  });
});

describe("hostNote", () => {
  it("points out a host address and names its block", () => {
    expect(hostNote("10.20.30.40/22")).toEqual({
      tr: "10.20.30.40 bir host adresi; blok 10.20.28.0/22",
      en: "10.20.30.40 is a host address; the block is 10.20.28.0/22",
    });
  });

  it("stays quiet for a network address, /31 and /32", () => {
    expect(hostNote("10.20.28.0/22")).toBeNull();
    expect(hostNote("10.0.0.1/31")).toBeNull();
    expect(hostNote("10.0.0.1")).toBeNull();
  });
});
