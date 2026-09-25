import { describe, expect, it } from "vitest";
import { compareLists, summarize } from "./logic";

const base = { caseSensitive: false, trim: true, sort: false } as const;
const A = "bir\niki\nüç";
const B = "iki\nüç\ndört";

describe("compareLists", () => {
  it("finds what is in both", () => {
    expect(compareLists(A, B, { ...base, operation: "both" })).toBe("iki\nüç");
  });

  it("finds what is only on each side", () => {
    expect(compareLists(A, B, { ...base, operation: "left-only" })).toBe("bir");
    expect(compareLists(A, B, { ...base, operation: "right-only" })).toBe(
      "dört",
    );
  });

  it("marks every line when asked for all", () => {
    const output = compareLists(A, B, { ...base, operation: "all" });
    expect(output).toContain("- bir");
    expect(output).toContain("  iki");
    expect(output).toContain("+ dört");
  });

  it("uses Turkish casing rules when case is ignored", () => {
    // Under the default locale "IŞIK".toLowerCase() is "ışık" only in Turkish.
    expect(compareLists("IŞIK", "ışık", { ...base, operation: "both" })).toBe(
      "IŞIK",
    );
  });

  it("can be case sensitive instead", () => {
    expect(
      compareLists("Bir", "bir", {
        ...base,
        operation: "both",
        caseSensitive: true,
      }),
    ).toBe("");
  });

  it("removes duplicates within a list", () => {
    expect(
      compareLists("a\na\nb", "a\nb", { ...base, operation: "both" }),
    ).toBe("a\nb");
  });

  it("ignores empty lines", () => {
    expect(
      compareLists("a\n\n\nb", "a", { ...base, operation: "left-only" }),
    ).toBe("b");
  });
});

describe("summarize", () => {
  it("counts each side and the overlap", () => {
    expect(summarize(A, B, { ...base, operation: "both" })).toEqual({
      left: 3,
      right: 3,
      shared: 2,
    });
  });
});
