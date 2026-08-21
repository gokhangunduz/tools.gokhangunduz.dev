import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import { compare, diffJson, formatChanges } from "./logic";

describe("diffJson", () => {
  it("finds nothing when the documents match", () => {
    expect(diffJson('{"a":1,"b":2}', '{"b":2,"a":1}', false)).toEqual([]);
  });

  it("waits while either side is blank", () => {
    expect(diffJson('{"a":1}', "  ", false)).toBeNull();
    expect(diffJson("", '{"a":1}', false)).toBeNull();
  });

  it("reports a changed value with both sides", () => {
    const output = formatChanges(diffJson('{"a":1}', '{"a":2}', false) ?? []);
    expect(output).toContain("~ $.a");
    expect(output).toContain("- 1");
    expect(output).toContain("+ 2");
  });

  it("reports added and removed keys by path", () => {
    const output = formatChanges(
      diffJson('{"a":{"b":1}}', '{"a":{"c":1}}', false) ?? [],
    );
    expect(output).toContain("- $.a.b");
    expect(output).toContain("+ $.a.c");
  });

  it("writes keys that are not identifiers in brackets", () => {
    expect(compare({ "a.b": 1 }, { "a.b": 2 }, "$", false)[0].path).toBe(
      '$["a.b"]',
    );
  });

  it("does not care about key order", () => {
    expect(compare({ a: 1, b: 2 }, { b: 2, a: 1 }, "$", false)).toHaveLength(0);
  });

  it("aligns arrays, so an insert at the front is one change", () => {
    expect(compare([1, 2, 3], [0, 1, 2, 3], "$", false)).toEqual([
      { path: "$[0]", kind: "added", right: 0 },
    ]);
    expect(compare([1, 2, 3], [1, 5, 3], "$", false)).toEqual([
      { path: "$[1]", kind: "changed", left: 2, right: 5 },
    ]);
  });

  it("matches objects in an array by id", () => {
    const left = [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ];
    const right = [
      { id: 0, name: "new" },
      { id: 1, name: "a" },
      { id: 2, name: "B" },
    ];
    expect(compare(left, right, "$", false)).toEqual([
      { path: "$[0]", kind: "added", right: { id: 0, name: "new" } },
      { path: "$[2].name", kind: "changed", left: "b", right: "B" },
    ]);
  });

  it("still sees a reordered array as changed by default", () => {
    expect(compare([1, 2], [2, 1], "$", false).length).toBeGreaterThan(0);
  });

  it("can treat an array as a multiset instead", () => {
    expect(compare([1, 2], [2, 1], "$", true)).toHaveLength(0);
    expect(compare([{ a: 1, b: 2 }], [{ b: 2, a: 1 }], "$", true)).toHaveLength(
      0,
    );
    expect(compare([1, 1, 2], [1, 2], "$", true)).toEqual([
      { path: "$[1]", kind: "removed", left: 1 },
    ]);
  });

  it("distinguishes null from a missing key", () => {
    const output = formatChanges(diffJson('{"a":null}', "{}", false) ?? []);
    expect(output).toContain("- $.a");
  });

  it("names the side and position of invalid JSON", () => {
    try {
      diffJson("{}", '{\n  "a": 1,\n}', false);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      const tool = error as ToolError;
      expect(tool.field).toBe("right");
      expect(tool.at).toEqual({ line: 2, column: 9 });
      expect(tool.localized.en).toMatch(/Invalid JSON/);
    }
  });
});
