import { describe, expect, it } from "vitest";
import { convertZones, readInstant } from "./logic";

describe("readInstant", () => {
  it("reads a wall-clock time in the given zone, not in UTC", () => {
    // 09:00 in Istanbul (UTC+3) is 06:00 UTC.
    expect(
      readInstant("2026-09-25 09:00", "Europe/Istanbul").toISOString(),
    ).toBe("2026-09-25T06:00:00.000Z");
  });

  it("handles a zone whose offset changes with DST", () => {
    // New York is UTC-4 in September and UTC-5 in January.
    expect(
      readInstant("2026-09-25 09:00", "America/New_York").toISOString(),
    ).toBe("2026-09-25T13:00:00.000Z");
    expect(
      readInstant("2026-01-25 09:00", "America/New_York").toISOString(),
    ).toBe("2026-01-25T14:00:00.000Z");
  });

  it("respects an explicit offset or Z", () => {
    expect(
      readInstant("2026-09-25T09:00:00Z", "Europe/Istanbul").toISOString(),
    ).toBe("2026-09-25T09:00:00.000Z");
  });

  it("reads a Unix timestamp", () => {
    expect(readInstant("1700000000", "UTC").toISOString()).toBe(
      "2023-11-14T22:13:20.000Z",
    );
  });

  it("rejects what it cannot read", () => {
    expect(() => readInstant("yarın öğlen", "UTC")).toThrow();
  });
});

describe("convertZones", () => {
  it("lists the instant in every zone", () => {
    const output = convertZones(
      "2026-09-25 09:00",
      "Europe/Istanbul",
      "",
      "en",
    );
    expect(output).toContain("Europe/Istanbul");
    expect(output).toContain("UTC");
    expect(output).toContain("Asia/Tokyo");
    // 06:00 UTC is 15:00 in Tokyo.
    expect(output).toMatch(/Asia\/Tokyo\s+Sep 25, 2026, 3:00 PM/);
  });

  it("includes extra zones the user names", () => {
    const output = convertZones(
      "2026-09-25 09:00",
      "UTC",
      "Pacific/Auckland",
      "en",
    );
    expect(output).toContain("Pacific/Auckland");
  });

  it("marks a zone it does not know instead of failing", () => {
    const output = convertZones(
      "2026-09-25 09:00",
      "UTC",
      "Mars/Olympus",
      "en",
    );
    expect(output).toContain("unknown time zone");
  });

  it("returns empty for blank input", () => {
    expect(convertZones("  ", "UTC", "", "tr")).toBe("");
  });
});
