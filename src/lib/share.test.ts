import { describe, expect, it } from "vitest";
import { encode, formatShared, parseShared } from "./share";

describe("shared state", () => {
  it("round-trips the input, direction and options", () => {
    const state = {
      input: "Merhaba dünya 👋",
      direction: "decode",
      options: { urlsafe: true, indent: "4" },
    };
    const fragment = formatShared(state);
    expect(fragment.startsWith("s=")).toBe(true);
    expect(parseShared(fragment)).toEqual(state);
  });

  it("leaves out what is at its default and writes nothing for an empty input", () => {
    expect(parseShared(formatShared({ input: "x", options: {} }))).toEqual({
      input: "x",
      direction: undefined,
      options: undefined,
    });
    expect(formatShared({ input: "", direction: "decode" })).toBe("");
    expect(formatShared({ input: "x".repeat(5000) })).toBe("");
  });

  it("still reads input-only links and ignores broken ones", () => {
    expect(parseShared(`i=${encode("eyJhbGciOi")}`)).toEqual({
      input: "eyJhbGciOi",
    });
    expect(parseShared("s=%%%")).toBe(null);
    expect(parseShared(`s=${encode('{"d":"x"}')}`)).toBe(null);
    expect(parseShared("section-2")).toBe(null);
  });
});
