import { describe, expect, it } from "vitest";
import { describeCidr } from "./logic";

function value(output: string, label: string): string {
  const line = output.split("\n").find((row) => row.startsWith(label));
  return line!.split(/\s{2,}/)[1];
}

describe("describeCidr", () => {
  it("computes a /24", () => {
    const output = describeCidr("192.168.1.130/24");
    expect(value(output, "CIDR")).toBe("192.168.1.0/24");
    expect(value(output, "netmask")).toBe("255.255.255.0");
    expect(value(output, "broadcast")).toBe("192.168.1.255");
    expect(value(output, "first host")).toBe("192.168.1.1");
    expect(value(output, "last host")).toBe("192.168.1.254");
    expect(value(output, "hosts")).toBe("254");
  });

  it("treats /31 as a point-to-point link with two usable addresses", () => {
    const output = describeCidr("10.0.0.0/31");
    expect(value(output, "hosts")).toBe("2");
    expect(value(output, "broadcast")).toBe("—");
  });

  it("treats /32 as a single host", () => {
    expect(value(describeCidr("10.0.0.5/32"), "hosts")).toBe("1");
  });

  it("handles a /8 without losing precision", () => {
    const output = describeCidr("10.0.0.0/8");
    expect(value(output, "hosts")).toBe("16 777 214");
  });

  it("recognises the private ranges", () => {
    expect(value(describeCidr("10.1.2.3/24"), "type")).toContain("private");
    expect(value(describeCidr("172.16.0.1/24"), "type")).toContain("private");
    expect(value(describeCidr("172.32.0.1/24"), "type")).toBe("public");
    expect(value(describeCidr("127.0.0.1/8"), "type")).toBe("loopback");
    expect(value(describeCidr("100.64.0.1/10"), "type")).toContain("CGNAT");
  });

  it("assumes /32 when no prefix is given", () => {
    expect(value(describeCidr("8.8.8.8"), "CIDR")).toBe("8.8.8.8/32");
  });

  it("rejects a malformed address or prefix", () => {
    expect(() => describeCidr("10.0.0")).toThrow();
    expect(() => describeCidr("10.0.0.256/24")).toThrow();
    expect(() => describeCidr("10.0.0.1/33")).toThrow();
  });

  it("returns empty for blank input", () => {
    expect(describeCidr("  ")).toBe("");
  });
});
