import { describe, expect, it } from "vitest";
import { format, inspect } from "./logic";

describe("inspect", () => {
  it("describes each character by code point and UTF-8 bytes", () => {
    const [first] = inspect("\u00e7");
    expect(first.codePoint).toBe(0xe7);
    expect(first.utf8).toBe("c3 a7");
  });

  it("keeps an emoji as one entry", () => {
    expect(inspect("\u{1f44b}")).toHaveLength(1);
  });

  it("flags a non-breaking space, which looks exactly like a space", () => {
    const entries = inspect("a\u00a0b");
    expect(entries[1].name).toBe("NO-BREAK SPACE");
    expect(entries[1].suspicious).toBe(true);
    expect(entries[0].suspicious).toBe(false);
  });

  it("flags zero-width characters and smart quotes", () => {
    expect(inspect("\u200b")[0].suspicious).toBe(true);
    expect(inspect("\u2019")[0].suspicious).toBe(true);
  });

  it("flags a Cyrillic letter hiding among Latin ones", () => {
    // "\u0430" is Cyrillic a, indistinguishable from Latin a on screen.
    const entries = inspect("p\u0430ssword");
    expect(entries[1].suspicious).toBe(true);
    expect(entries[1].name).toBe("CYRILLIC");
  });

  it("names control characters", () => {
    expect(inspect("\t")[0].name).toBe("TAB");
  });
});

describe("format", () => {
  it("counts the suspicious characters at the end", () => {
    expect(format("a\u00a0b", "en")).toContain("1 suspicious character");
    expect(format("ab", "en")).not.toContain("suspicious");
  });

  it("returns empty for empty input", () => {
    expect(format("", "tr")).toBe("");
  });
});
