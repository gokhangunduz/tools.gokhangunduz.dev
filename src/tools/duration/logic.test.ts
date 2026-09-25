import { describe, expect, it } from "vitest";
import { describeDuration, human, toMilliseconds } from "./logic";

describe("toMilliseconds", () => {
  it("reads a bare number in the selected unit", () => {
    expect(toMilliseconds("90", "s")).toBe(90_000);
    expect(toMilliseconds("90000", "ms")).toBe(90_000);
  });

  it("reads a compound duration", () => {
    expect(toMilliseconds("1h 30m", "ms")).toBe(5_400_000);
    expect(toMilliseconds("2 gün 3 saat", "ms")).toBe(
      2 * 86_400_000 + 3 * 3_600_000,
    );
  });

  it("rejects what it cannot read", () => {
    expect(() => toMilliseconds("bir süre", "ms")).toThrow();
    expect(() => toMilliseconds("", "ms")).toThrow();
  });
});

describe("describeDuration", () => {
  it("prints every unit and the ISO form", () => {
    const output = describeDuration("5400000", "ms", "en");
    expect(output).toContain("5400000");
    expect(output).toContain("1.5");
    expect(output).toContain("PT1H30M");
  });
});

describe("human", () => {
  it("writes the largest three units", () => {
    expect(
      human(2 * 86_400_000 + 3 * 3_600_000 + 4 * 60_000 + 5000, "en"),
    ).toBe("2 d 3 h 4 m");
  });

  it("uses Turkish labels", () => {
    expect(human(90_000, "tr")).toBe("1 dk 30 sn");
  });

  it("handles zero and negatives", () => {
    expect(human(0, "en")).toBe("0 ms");
    expect(human(-60_000, "en")).toBe("-1 m");
  });
});
