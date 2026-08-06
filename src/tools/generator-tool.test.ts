import { describe, expect, it } from "vitest";
import { toGenerated } from "./generator-tool";
import { toDualResult } from "./dual-tool";

describe("toGenerated", () => {
  it("reads a string as one value per line", () => {
    expect(toGenerated("a\nb")).toEqual({ items: ["a", "b"], text: "a\nb" });
  });

  it("has no rows for an empty string", () => {
    expect(toGenerated("")).toEqual({ items: [], text: "" });
  });

  it("keeps a formatted text beside the rows", () => {
    expect(toGenerated({ items: ["a", "b"], text: '["a","b"]' })).toEqual({
      items: ["a", "b"],
      text: '["a","b"]',
    });
  });

  it("joins the rows when no text is given", () => {
    expect(toGenerated({ items: ["a", "b"] }).text).toBe("a\nb");
  });
});

describe("toDualResult", () => {
  it("wraps plain text and passes a result through", () => {
    expect(toDualResult("x")).toEqual({ text: "x" });
    const result = { text: "x", data: [1] };
    expect(toDualResult(result)).toBe(result);
  });
});
