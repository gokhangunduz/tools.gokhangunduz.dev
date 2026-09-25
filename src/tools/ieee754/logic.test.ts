import { describe, expect, it } from "vitest";
import { describeFloat } from "./logic";

describe("describeFloat", () => {
  it("shows why 0.1 is not exactly 0.1", () => {
    const output = describeFloat("0.1", "double");
    expect(output).toContain("0x3fb999999999999a");
    expect(output).toContain("0.10000000000000000555");
  });

  it("shows the precision lost by storing a double as a float", () => {
    const output = describeFloat("3.14", "single");
    expect(output).toContain("3.14000010");
    expect(output).toMatch(/error\s+0\.0000001/);
  });

  it("reads a bit pattern back into a value", () => {
    expect(describeFloat("0x3fb999999999999a", "double")).toContain(
      "0.10000000000000000555",
    );
    expect(describeFloat("0x40490fdb", "single")).toContain("3.14159");
  });

  it("splits sign, exponent and mantissa", () => {
    const output = describeFloat("1", "double");
    expect(output).toContain("sign");
    // Exponent of 1.0 is the bias itself, so the unbiased value is 0.
    expect(output).toMatch(/1023 - 1023 = 0/);
  });

  it("labels infinity and subnormals", () => {
    expect(describeFloat("1e400", "double")).toContain("Inf / NaN");
    expect(describeFloat("5e-324", "double")).toContain("subnormal");
  });

  it("returns empty for blank input", () => {
    expect(describeFloat("  ", "double")).toBe("");
  });
});
