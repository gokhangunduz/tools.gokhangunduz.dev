import { describe, expect, it } from "vitest";
import { compare, diffJson } from "./logic";

describe("diffJson", () => {
  it("says so when the documents match", () => {
    expect(diffJson('{"a":1,"b":2}', '{"b":2,"a":1}', false)).toContain(
      "identical",
    );
  });

  it("reports a changed value with both sides", () => {
    const output = diffJson('{"a":1}', '{"a":2}', false);
    expect(output).toContain("~ $.a");
    expect(output).toContain("- 1");
    expect(output).toContain("+ 2");
  });

  it("reports added and removed keys by path", () => {
    const output = diffJson('{"a":{"b":1}}', '{"a":{"c":1}}', false);
    expect(output).toContain("- $.a.b");
    expect(output).toContain("+ $.a.c");
  });

  it("does not care about key order", () => {
    expect(compare({ a: 1, b: 2 }, { b: 2, a: 1 }, "$", false)).toHaveLength(0);
  });

  it("compares arrays by position by default", () => {
    expect(compare([1, 2], [2, 1], "$", false)).toHaveLength(2);
  });

  it("can treat an array as a set instead", () => {
    expect(compare([1, 2], [2, 1], "$", true)).toHaveLength(0);
  });

  it("distinguishes null from a missing key", () => {
    const output = diffJson('{"a":null}', "{}", false);
    expect(output).toContain("- $.a");
  });

  it("reports invalid JSON", () => {
    expect(() => diffJson("{nope}", "{}", false)).toThrow(/Invalid JSON/);
  });
});
