import { describe, expect, it } from "vitest";
import { compute } from "./logic";

describe("compute", () => {
  it("computes AND, OR and XOR", () => {
    expect(compute("12 10", "and")).toContain("8");
    expect(compute("12 10", "or")).toContain("14");
    expect(compute("12 10", "xor")).toContain("6");
  });

  it("shows the operands in four-bit groups", () => {
    expect(compute("255 0", "or")).toContain(
      "0000 0000 0000 0000 0000 0000 1111 1111",
    );
  });

  it("reads hex and binary operands", () => {
    expect(compute("0xff 0b1111", "and")).toContain("15");
  });

  it("distinguishes >> from >>>", () => {
    expect(compute("-8 1", "shr")).toContain("-4");
    expect(compute("-8 1", "ushr")).toContain("2147483644");
  });

  it("takes one operand for NOT", () => {
    expect(compute("0", "not")).toContain("-1");
  });

  it("asks for the second value when it is missing", () => {
    expect(() => compute("12", "and")).toThrow(/Two values/);
  });

  it("refuses a value that does not fit in 32 bits", () => {
    expect(() => compute("4294967296 1", "and")).toThrow(/32 bits/);
  });

  it("refuses something that is not an integer", () => {
    expect(() => compute("1.5 1", "and")).toThrow();
  });
});
