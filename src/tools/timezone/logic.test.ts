import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import { convertZones, nowIn, readInstant } from "./logic";
import {
  formatOffset,
  isoInZone,
  listZones,
  pickZone,
  resolveZone,
} from "./zones";

const NOW = new Date("2026-09-25T10:00:00Z");

describe("readInstant", () => {
  it("reads a wall-clock time in the given zone, not in UTC", () => {
    expect(
      readInstant("2026-09-25 09:00", "Europe/Istanbul").toISOString(),
    ).toBe("2026-09-25T06:00:00.000Z");
  });

  it("handles a zone whose offset changes with DST", () => {
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
    expect(readInstant("2026-09-25 09:00 +05:30", "UTC").toISOString()).toBe(
      "2026-09-25T03:30:00.000Z",
    );
  });

  it("reads a bare ±HH offset", () => {
    expect(readInstant("2026-09-25 09:00+03", "UTC").toISOString()).toBe(
      "2026-09-25T06:00:00.000Z",
    );
    expect(readInstant("2026-09-25 09:00 -05", "UTC").toISOString()).toBe(
      "2026-09-25T14:00:00.000Z",
    );
  });

  it("reads HH:mm as today in the source zone", () => {
    // 10:00 UTC is already 13:00 on the 25th in Istanbul.
    expect(readInstant("14:30", "Europe/Istanbul", NOW).toISOString()).toBe(
      "2026-09-25T11:30:00.000Z",
    );
    // Tokyo is on the 25th too (19:00), so 08:15:30 there is 23:15:30 UTC the day before.
    expect(readInstant("08:15:30", "Asia/Tokyo", NOW).toISOString()).toBe(
      "2026-09-24T23:15:30.000Z",
    );
  });

  it("reads DD.MM.YYYY with and without a time", () => {
    expect(
      readInstant("25.09.2026 09:00", "Europe/Istanbul").toISOString(),
    ).toBe("2026-09-25T06:00:00.000Z");
    expect(readInstant("01.02.2026", "UTC").toISOString()).toBe(
      "2026-02-01T00:00:00.000Z",
    );
  });

  it("reads a Unix timestamp", () => {
    expect(readInstant("1700000000", "UTC").toISOString()).toBe(
      "2023-11-14T22:13:20.000Z",
    );
  });

  it("rejects what it cannot read, and a date that does not exist", () => {
    expect(() => readInstant("yarın öğlen", "UTC")).toThrow(ToolError);
    expect(() => readInstant("31.02.2026", "UTC")).toThrow(ToolError);
    expect(() => readInstant("25:00", "UTC")).toThrow(ToolError);
  });
});

describe("zones", () => {
  it("puts UTC first", () => {
    expect(listZones()[0]).toBe("UTC");
  });

  it("finds a zone from a city, in any case or accent", () => {
    expect(resolveZone("istanbul")).toBe("Europe/Istanbul");
    expect(resolveZone("İstanbul")).toBe("Europe/Istanbul");
    expect(resolveZone("new york")).toBe("America/New_York");
    expect(resolveZone("europe/berlin")).toBe("Europe/Berlin");
    expect(resolveZone("Mars/Olympus")).toBeNull();
  });

  it("formats offsets and ISO with the zone's offset", () => {
    expect(formatOffset(3 * 3600_000)).toBe("UTC+03:00");
    expect(formatOffset(-5.5 * 3600_000)).toBe("UTC−05:30");
    expect(isoInZone(new Date("2023-11-14T22:13:20Z"), "Europe/Istanbul")).toBe(
      "2023-11-15T01:13:20.000+03:00",
    );
    expect(isoInZone(new Date("2023-11-14T22:13:20Z"), "UTC")).toBe(
      "2023-11-14T22:13:20.000Z",
    );
  });
});

describe("convertZones", () => {
  it("lists the instant in every zone, with the day shift", () => {
    const result = convertZones(
      "2026-09-25 09:00",
      "Europe/Istanbul",
      [],
      "en",
    );
    const tokyo = result?.rows.find((row) => row.zone === "Asia/Tokyo");
    expect(tokyo).toMatchObject({
      time: "15:00",
      dayDelta: 0,
      offset: "UTC+09:00",
    });
    const late = convertZones("2026-09-25 23:30", "Europe/Istanbul", [], "en");
    expect(late?.rows.find((row) => row.zone === "Asia/Tokyo")?.dayDelta).toBe(
      1,
    );
    expect(
      late?.rows.find((row) => row.zone === "America/Los_Angeles")?.dayDelta,
    ).toBe(0);
    expect(result?.rows[0]).toMatchObject({
      zone: "Europe/Istanbul",
      source: true,
    });
    expect(result?.isoUtc).toBe("2026-09-25T06:00:00.000Z");
    expect(result?.isoSource).toBe("2026-09-25T09:00:00.000+03:00");
    expect(result?.unix).toBe("1790316000");
  });

  it("includes extra zones the user names, by city too", () => {
    const result = convertZones("2026-09-25 09:00", "UTC", ["auckland"], "en");
    expect(result?.rows.map((row) => row.zone)).toContain("Pacific/Auckland");
  });

  it("marks an extra zone it does not know instead of failing", () => {
    const result = convertZones(
      "2026-09-25 09:00",
      "UTC",
      ["Mars/Olympus"],
      "en",
    );
    expect(result?.rows.find((row) => row.zone === "Mars/Olympus")?.valid).toBe(
      false,
    );
    expect(result?.text).toContain("unknown time zone");
  });

  it("rejects an unknown source zone with a bilingual error on its field", () => {
    try {
      convertZones("2026-09-25 09:00", "Mars/Olympus", [], "tr");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      expect((error as ToolError).field).toBe("source");
      expect((error as ToolError).localized.tr).toContain("saat dilimi");
    }
  });

  it("returns null for blank input", () => {
    expect(convertZones("  ", "UTC", [], "tr")).toBeNull();
  });

  it("prints now in a zone", () => {
    expect(nowIn("Europe/Istanbul", NOW)).toBe("2026-09-25 13:00");
  });
});

describe("pickZone", () => {
  it("takes the only zone that contains a partial name", () => {
    expect(pickZone("singap")).toBe("Asia/Singapore");
    expect(pickZone("los ang")).toBe("America/Los_Angeles");
    expect(pickZone("istanbul")).toBe("Europe/Istanbul");
  });

  it("refuses text that matches no zone or several", () => {
    expect(pickZone("Mars/Base")).toBeNull();
    expect(pickZone("america")).toBeNull();
    expect(pickZone("  ")).toBeNull();
  });
});
