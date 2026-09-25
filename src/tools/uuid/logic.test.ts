import { describe, expect, it } from "vitest";
import { generateIds, inspect } from "./logic";

describe("generateIds", () => {
  it("produces the requested number of v4 UUIDs", () => {
    const lines = generateIds("v4", 5, false).split("\n");
    expect(lines).toHaveLength(5);
    for (const line of lines) {
      expect(line).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
  });

  it("produces v7 UUIDs that sort by creation time", () => {
    const first = generateIds("v7", 1, false);
    const second = generateIds("v7", 1, false);
    // The timestamp is the leading field, so lexical order is time order.
    expect([first, second].sort()).toEqual([first, second].sort());
    expect(inspect(first)).toContain("v7");
  });

  it("stamps v7 with the current time", () => {
    const id = generateIds("v7", 1, false);
    const described = inspect(id)!;
    const stamped = new Date(described.split(" · ")[1]).getTime();
    expect(Math.abs(stamped - Date.now())).toBeLessThan(5000);
  });

  it("produces ULIDs in Crockford base32", () => {
    const value = generateIds("ulid", 1, false);
    expect(value).toHaveLength(26);
    expect(value).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("produces Nano IDs of the usual length", () => {
    expect(generateIds("nanoid", 1, false)).toHaveLength(21);
  });

  it("does not repeat itself", () => {
    const lines = generateIds("v4", 100, false).split("\n");
    expect(new Set(lines).size).toBe(100);
  });

  it("refuses an unreasonable count", () => {
    expect(() => generateIds("v4", 0, false)).toThrow();
    expect(() => generateIds("v4", 5000, false)).toThrow();
  });
});

describe("inspect", () => {
  it("reports the version of a pasted UUID", () => {
    expect(inspect("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe("UUID v4");
  });

  it("returns null for something that is not a UUID", () => {
    expect(inspect("nope")).toBeNull();
  });
});
