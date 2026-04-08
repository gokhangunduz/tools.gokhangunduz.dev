import { describe, expect, it } from "vitest";
import { describeSla } from "./logic";

describe("describeSla", () => {
  it("gives the familiar figures for three nines", () => {
    const output = describeSla("99.9");
    // 0.1% of a year is 8 hours 46 minutes.
    expect(output).toContain("8 sa 46 dk");
    // And of a month, 43 minutes.
    expect(output).toContain("43 dk 12 sn");
  });

  it("gives them for four and five nines", () => {
    expect(describeSla("99.99")).toContain("52 dk");
    expect(describeSla("99.999")).toContain("5 dk");
  });

  it("accepts a percent sign and a comma", () => {
    expect(describeSla("99,9%")).toBe(describeSla("99.9"));
  });

  it("rejects a figure outside 0–100", () => {
    expect(() => describeSla("101")).toThrow();
    expect(() => describeSla("0")).toThrow();
    expect(() => describeSla("çok")).toThrow();
  });

  it("returns empty for blank input", () => {
    expect(describeSla("  ")).toBe("");
  });
});
