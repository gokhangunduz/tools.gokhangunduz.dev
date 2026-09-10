import { describe as group, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import { describe, detectUnit, parseInput, relative } from "./logic";

const iso = (input: string, options?: Parameters<typeof parseInput>[1]) =>
  parseInput(input, options).date.toISOString();

group("detectUnit", () => {
  it("reads the unit from the digit count", () => {
    expect(detectUnit("1700000000")).toBe("s");
    expect(detectUnit("17000000000")).toBe("s");
    expect(detectUnit("1700000000000")).toBe("ms");
    expect(detectUnit("1700000000000000")).toBe("us");
    expect(detectUnit("1700000000000000000")).toBe("ns");
    expect(() => detectUnit("17000000000000000000")).toThrow(ToolError);
  });
});

group("parseInput", () => {
  it("reads seconds, milliseconds, microseconds and nanoseconds without being told which", () => {
    expect(iso("1700000000")).toBe("2023-11-14T22:13:20.000Z");
    expect(iso("1700000000000")).toBe("2023-11-14T22:13:20.000Z");
    expect(iso("1700000000123456")).toBe("2023-11-14T22:13:20.123Z");
    expect(iso("1700000000123456789")).toBe("2023-11-14T22:13:20.123Z");
    expect(parseInput("1700000000123456").unit).toBe("us");
  });

  it("lets the unit be overridden", () => {
    expect(iso("1700000000", { unit: "ms" })).toBe("1970-01-20T16:13:20.000Z");
  });

  it("reads fractional seconds", () => {
    expect(iso("1700000000.5")).toBe("2023-11-14T22:13:20.500Z");
  });

  it("reads ISO 8601 with an offset as an instant", () => {
    const parsed = parseInput("2026-09-25T12:00:00Z", {
      zone: "Europe/Istanbul",
    });
    expect(parsed.date.getTime()).toBe(Date.UTC(2026, 8, 25, 12));
    expect(parsed.zoned).toBe(false);
  });

  it("reads an offset-less date in the selected zone", () => {
    const parsed = parseInput("2023-11-15 01:13:20", {
      zone: "Europe/Istanbul",
    });
    expect(parsed.date.toISOString()).toBe("2023-11-14T22:13:20.000Z");
    expect(parsed.zoned).toBe(true);
    expect(iso("15.11.2023 01:13", { zone: "Europe/Istanbul" })).toBe(
      "2023-11-14T22:13:00.000Z",
    );
    expect(iso("15.11.2023", { zone: "UTC" })).toBe("2023-11-15T00:00:00.000Z");
  });

  it("reads a date before 1970 as a negative timestamp", () => {
    expect(iso("-86400")).toBe("1969-12-31T00:00:00.000Z");
  });

  it("rejects what it cannot read", () => {
    expect(() => parseInput("yarın")).toThrow(ToolError);
    expect(() => parseInput("")).toThrow(ToolError);
  });
});

group("describe", () => {
  it("prints every representation of the same instant", () => {
    const { text, unit } = describe("1700000000", "tr", "UTC");
    expect(unit).toBe("s");
    expect(text).toContain("1700000000");
    expect(text).toContain("1700000000000");
    expect(text).toContain("2023-11-14T22:13:20.000Z");
    expect(text).toContain("Salı");
  });

  it("folds the weekday into the zone row and adds local ISO", () => {
    const { rows } = describe("1700000000", "en", "Europe/Istanbul");
    const zone = rows.find((row) => row.label === "Europe/Istanbul");
    expect(zone?.value).toMatch(
      /^Wednesday, Nov 15, 2023 01:13:20 \(UTC\+03:00\)$/,
    );
    expect(rows.find((row) => row.label === "ISO 8601 (local)")?.value).toBe(
      "2023-11-15T01:13:20.000+03:00",
    );
  });

  it("accepts a city as the zone", () => {
    expect(describe("1700000000", "tr", "istanbul").zone).toBe(
      "Europe/Istanbul",
    );
  });

  it("keeps the zone-free rows when the zone is wrong", () => {
    const result = describe("1700000000", "en", "Mars/Base");
    expect(result.zoneError?.field).toBe("timeZone");
    expect(result.rows.map((row) => row.label)).toContain("ISO 8601 (UTC)");
    expect(result.rows.map((row) => row.label)).not.toContain(
      "ISO 8601 (local)",
    );
  });

  it("refuses an offset-less date when the zone is wrong", () => {
    expect(() => describe("2023-11-15 01:13", "en", "Mars/Base")).toThrow(
      /time zone/,
    );
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
