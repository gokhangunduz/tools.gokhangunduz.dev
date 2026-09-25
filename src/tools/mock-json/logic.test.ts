import { describe, expect, it } from "vitest";
import { FIELD_NAMES, generateMock } from "./logic";

describe("generateMock", () => {
  it("produces the requested fields and count", () => {
    const rows = JSON.parse(
      generateMock({ count: 5, fields: "id, name, email", indent: 0 }),
    );
    expect(rows).toHaveLength(5);
    expect(Object.keys(rows[0])).toEqual(["id", "name", "email"]);
  });

  it("numbers ids from one", () => {
    const rows = JSON.parse(
      generateMock({ count: 3, fields: "id", indent: 0 }),
    );
    expect(rows.map((row: { id: number }) => row.id)).toEqual([1, 2, 3]);
  });

  it("produces Turkish names, so encoding problems surface in testing", () => {
    const value = generateMock({ count: 40, fields: "name", indent: 0 });
    expect(value).toMatch(/[çğıöşüÇĞİÖŞÜ]/);
  });

  it("keeps generated email addresses ASCII", () => {
    const rows = JSON.parse(
      generateMock({ count: 20, fields: "email", indent: 0 }),
    );
    for (const row of rows) {
      expect(row.email).toMatch(/^[a-z.]+@[a-z.]+$/);
    }
  });

  it("names the fields it knows when given one it does not", () => {
    expect(() => generateMock({ count: 1, fields: "nope", indent: 0 })).toThrow(
      /Available/,
    );
  });

  it("supports every advertised field", () => {
    const value = generateMock({
      count: 2,
      fields: FIELD_NAMES.join(","),
      indent: 0,
    });
    expect(JSON.parse(value)).toHaveLength(2);
  });

  it("refuses an unreasonable count", () => {
    expect(() => generateMock({ count: 0, fields: "id", indent: 0 })).toThrow();
    expect(() =>
      generateMock({ count: 5000, fields: "id", indent: 0 }),
    ).toThrow();
  });
});
