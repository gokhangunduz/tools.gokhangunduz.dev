import { describe, expect, it } from "vitest";
import { describeAddress } from "./logic";

function value(output: string, label: string): string {
  return output
    .split("\n")
    .find((row) => row.startsWith(label))!
    .split(/\s{2,}/)[1];
}

describe("describeAddress", () => {
  it("converts a dotted address to every other form", () => {
    const output = describeAddress("10.0.0.1");
    expect(value(output, "integer")).toBe("167772161");
    expect(value(output, "hex")).toBe("0x0a000001");
    expect(value(output, "IPv6 mapped")).toBe("::ffff:10.0.0.1");
    expect(value(output, "in-addr.arpa")).toBe("1.0.0.10.in-addr.arpa");
  });

  it("reads an integer back", () => {
    expect(value(describeAddress("167772161"), "IPv4")).toBe("10.0.0.1");
  });

  it("reads hex", () => {
    expect(value(describeAddress("0x0a000001"), "IPv4")).toBe("10.0.0.1");
  });

  it("reads the IPv4-mapped IPv6 forms a proxy logs", () => {
    expect(value(describeAddress("::ffff:10.0.0.1"), "integer")).toBe(
      "167772161",
    );
    expect(value(describeAddress("::ffff:0a00:0001"), "IPv4")).toBe("10.0.0.1");
  });

  it("handles the broadcast address without sign problems", () => {
    expect(value(describeAddress("255.255.255.255"), "integer")).toBe(
      "4294967295",
    );
  });

  it("rejects an out-of-range integer and nonsense", () => {
    expect(() => describeAddress("4294967296")).toThrow();
    expect(() => describeAddress("bir adres")).toThrow();
  });

  it("returns empty for blank input", () => {
    expect(describeAddress("  ")).toBe("");
  });
});
