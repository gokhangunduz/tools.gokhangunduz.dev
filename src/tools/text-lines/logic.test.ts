import { describe, expect, it } from "vitest";
import { processLines } from "./logic";

const base = { caseSensitive: false };

describe("processLines", () => {
  it("sorts with Turkish collation", () => {
    // Code-point order would put "zebra" before "çilek"; Turkish does not.
    expect(
      processLines("zebra\nçilek\narmut", { ...base, operation: "sort" }),
    ).toBe("armut\nçilek\nzebra");
  });

  it("sorts numbers inside text the way a person would", () => {
    expect(processLines("v10\nv2\nv1", { ...base, operation: "sort" })).toBe(
      "v1\nv2\nv10",
    );
  });

  it("removes duplicates, keeping the first spelling", () => {
    expect(
      processLines("Bir\nbir\niki", { ...base, operation: "unique" }),
    ).toBe("Bir\niki");
  });

  it("can be case sensitive instead", () => {
    expect(
      processLines("Bir\nbir", { operation: "unique", caseSensitive: true }),
    ).toBe("Bir\nbir");
  });

  it("numbers lines with aligned padding", () => {
    const output = processLines(
      Array.from({ length: 10 }, (_, i) => `line ${i}`).join("\n"),
      { ...base, operation: "number" },
    );
    expect(output.split("\n")[0]).toBe(" 1. line 0");
    expect(output.split("\n")[9]).toBe("10. line 9");
  });

  it("counts duplicates, most frequent first", () => {
    const output = processLines("a\nb\na\nc\na\nb", {
      ...base,
      operation: "count-duplicates",
    });
    expect(output.split("\n")[0].trim()).toBe("3  a");
  });

  it("keeps the same lines when shuffling", () => {
    const input = "a\nb\nc\nd";
    const output = processLines(input, { ...base, operation: "shuffle" });
    expect(output.split("\n").sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("trims and drops empty lines", () => {
    expect(processLines("  a  \n\n b ", { ...base, operation: "trim" })).toBe(
      "a\n\nb",
    );
    expect(
      processLines("a\n\n  \nb", { ...base, operation: "remove-empty" }),
    ).toBe("a\nb");
  });
});
