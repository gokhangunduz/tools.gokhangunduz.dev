import { describe, expect, it } from "vitest";
import { footnoteFor, formatIds, generateIds, inspect } from "./logic";

const V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function isSorted(values: string[]): boolean {
  return values.every((value, i) => i === 0 || values[i - 1] < value);
}

describe("generateIds", () => {
  it("produces the requested number of v4 UUIDs", () => {
    const ids = generateIds("v4", 5);
    expect(ids).toHaveLength(5);
    for (const id of ids) expect(id).toMatch(V4);
  });

  it("keeps v7 in creation order within one millisecond", () => {
    const ids = generateIds("v7", 1000);
    expect(isSorted(ids)).toBe(true);
    expect(new Set(ids).size).toBe(1000);
    for (const id of ids) expect(id[14]).toBe("7");
  });

  it("keeps ULIDs in creation order within one millisecond", () => {
    const ids = generateIds("ulid", 1000);
    expect(isSorted(ids)).toBe(true);
    expect(new Set(ids).size).toBe(1000);
  });

  it("stays in order across calls", () => {
    const first = generateIds("v7", 1)[0];
    const second = generateIds("v7", 1)[0];
    expect(first < second).toBe(true);
  });

  it("stamps v7 with the current time", () => {
    const found = inspect(generateIds("v7", 1)[0]);
    expect(found?.valid && found.time).toBeTruthy();
    if (found?.valid && found.time) {
      expect(Math.abs(found.time.getTime() - Date.now())).toBeLessThan(5000);
    }
  });

  it("produces ULIDs in Crockford base32", () => {
    const [value] = generateIds("ulid", 1);
    expect(value).toHaveLength(26);
    expect(value).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("produces Nano IDs of the usual length", () => {
    expect(generateIds("nanoid", 1)[0]).toHaveLength(21);
  });

  it("drops the dashes and uppercases on request, for UUIDs only", () => {
    const [id] = generateIds("v4", 1, { dashes: false, upper: true });
    expect(id).toMatch(/^[0-9A-F]{32}$/);
    const ulids = generateIds("ulid", 1, { dashes: false });
    expect(ulids[0]).toHaveLength(26);
  });

  it("does not repeat itself", () => {
    expect(new Set(generateIds("v4", 100)).size).toBe(100);
  });

  it("refuses an unreasonable count", () => {
    expect(() => generateIds("v4", 0)).toThrow();
    expect(() => generateIds("v4", 1001)).toThrow();
    expect(() => generateIds("v4", 2.5)).toThrow();
    expect(() => generateIds("v4", NaN)).toThrow();
  });
});

describe("formatIds", () => {
  const ids = ["a", "b"];

  it("joins one per line", () => {
    expect(formatIds(ids, "lines")).toBe("a\nb");
  });

  it("writes a JSON array", () => {
    expect(JSON.parse(formatIds(ids, "json"))).toEqual(ids);
  });

  it("joins with commas", () => {
    expect(formatIds(ids, "comma")).toBe("a, b");
  });

  it("writes an SQL IN list", () => {
    expect(formatIds(ids, "sql")).toBe("IN ('a', 'b')");
  });
});

describe("inspect", () => {
  it("reports the version and variant of a pasted UUID", () => {
    const found = inspect("f47ac10b-58cc-4372-a567-0e02b2c3d479");
    expect(found).toMatchObject({
      valid: true,
      kind: "uuid",
      version: { en: "UUID v4" },
      variant: { en: "RFC 9562" },
    });
    expect(found?.valid && found.time).toBeFalsy();
  });

  it("reads the timestamp out of a v7, with or without dashes", () => {
    const id = "01920f3a-7b2c-7def-8123-456789abcdef";
    const expected = new Date(0x01920f3a7b2c).toISOString();
    for (const value of [id, id.replace(/-/g, ""), id.toUpperCase()]) {
      const found = inspect(value);
      expect(found?.valid && found.time?.toISOString()).toBe(expected);
    }
  });

  it("reads the timestamp out of a ULID", () => {
    const found = inspect("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(found).toMatchObject({ valid: true, kind: "ulid" });
    expect(found?.valid && found.time?.toISOString()).toBe(
      "2016-07-30T23:54:10.259Z",
    );
  });

  it("knows the nil UUID", () => {
    expect(inspect("00000000-0000-0000-0000-000000000000")).toMatchObject({
      version: { en: "Nil UUID" },
    });
  });

  it("says invalid for something that is neither", () => {
    expect(inspect("nope")).toEqual({ valid: false });
    expect(inspect("81ARZ3NDEKTSV4RRFFQ69G5FAV")).toEqual({ valid: false });
  });

  it("returns null for blank input", () => {
    expect(inspect("  ")).toBeNull();
  });
});

describe("footnoteFor", () => {
  it("gives v4 the primary-key advice", () => {
    expect(footnoteFor("v4", "x").en).toContain("primary key");
  });

  it("gives v7 the timestamp of the first id, whatever the list format", () => {
    const text = formatIds(["01920f3a-7b2c-7def-8123-456789abcdef"], "json");
    expect(footnoteFor("v7", text).en).toContain(
      new Date(0x01920f3a7b2c).toISOString(),
    );
  });
});
