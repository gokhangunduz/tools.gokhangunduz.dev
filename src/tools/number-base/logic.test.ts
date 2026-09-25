import { describe, expect, it } from "vitest";
import { describeNumber, parseNumber } from "./logic";

describe("parseNumber", () => {
  it("detects the base from the prefix", () => {
    expect(parseNumber("0xff", "auto")).toBe(255n);
    expect(parseNumber("0b1010", "auto")).toBe(10n);
    expect(parseNumber("0o17", "auto")).toBe(15n);
    expect(parseNumber("42", "auto")).toBe(42n);
  });

  it("keeps precision past what a double can hold", () => {
    // 2^53 + 1, which Number would round to 2^53.
    expect(parseNumber("9007199254740993", 10)).toBe(9007199254740993n);
  });

  it("ignores spaces and underscores used as separators", () => {
    expect(parseNumber("1_000_000", 10)).toBe(1_000_000n);
    expect(parseNumber("1010 1010", 2)).toBe(170n);
  });

  it("handles negatives", () => {
    expect(parseNumber("-ff", 16)).toBe(-255n);
  });

  it("rejects a digit that does not belong to the base", () => {
    expect(() => parseNumber("12", 2)).toThrow(/base 2/);
    expect(() => parseNumber("zz", 16)).toThrow();
  });
});

describe("describeNumber", () => {
  it("prints every base and the bit width", () => {
    const output = describeNumber("255", 10);
    expect(output).toContain("ff");
    expect(output).toContain("377");
    expect(output).toContain("11111111");
    expect(output).toMatch(/bit\s+8/);
  });

  it("adds the unsigned 32-bit reading of a negative", () => {
    expect(describeNumber("-1", 10)).toContain("4294967295");
  });
});
