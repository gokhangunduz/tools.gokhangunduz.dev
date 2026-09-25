import { describe as group, expect, it } from "vitest";
import { describe, parseInput, relative } from "./logic";

group("parseInput", () => {
  it("reads seconds and milliseconds without being told which", () => {
    expect(parseInput("1700000000").toISOString()).toBe(
      "2023-11-14T22:13:20.000Z",
    );
    expect(parseInput("1700000000000").toISOString()).toBe(
      "2023-11-14T22:13:20.000Z",
    );
  });

  it("reads ISO 8601", () => {
    expect(parseInput("2026-09-25T12:00:00Z").getTime()).toBe(
      Date.UTC(2026, 8, 25, 12),
    );
  });

  it("reads a date before 1970 as a negative timestamp", () => {
    expect(parseInput("-86400").toISOString()).toBe("1969-12-31T00:00:00.000Z");
  });

  it("rejects what it cannot read", () => {
    expect(() => parseInput("yarın")).toThrow();
    expect(() => parseInput("")).toThrow();
  });
});

group("describe", () => {
  it("prints every representation of the same instant", () => {
    const output = describe("1700000000", "tr", "UTC");
    expect(output).toContain("1700000000");
    expect(output).toContain("1700000000000");
    expect(output).toContain("2023-11-14T22:13:20.000Z");
    expect(output).toContain("Salı");
  });

  it("formats in the requested time zone", () => {
    const output = describe("1700000000", "en", "Europe/Istanbul");
    expect(output).toContain("Europe/Istanbul");
    // 22:13 UTC is 01:13 the next day in Istanbul.
    expect(output).toMatch(/Nov 15, 2023/);
  });
});

group("relative", () => {
  it("counts backwards and forwards", () => {
    expect(relative(new Date(Date.now() - 3 * 86400_000), "en")).toBe(
      "3 days ago",
    );
    expect(relative(new Date(Date.now() + 2 * 3600_000), "tr")).toContain(
      "saat",
    );
  });
});
