import { describe, expect, it } from "vitest";
import { escapeUnicode, unescapeUnicode } from "./logic";

describe("escapeUnicode", () => {
  it("leaves ASCII alone by default", () => {
    expect(escapeUnicode("ok!", "u", false)).toBe("ok!");
  });

  it("escapes Turkish characters as code units", () => {
    expect(escapeUnicode("ş", "u", false)).toBe("\\u015f");
  });

  it("emits both halves of a surrogate pair", () => {
    // 👋, not one broken escape.
    expect(escapeUnicode("👋", "u", false)).toBe("\\ud83d\\udc4b");
  });

  it("writes an astral code point once in the {} form", () => {
    expect(escapeUnicode("👋", "codepoint", false)).toBe("\\u{1f44b}");
  });

  it("can escape ASCII too", () => {
    expect(escapeUnicode("A", "u", true)).toBe("\\u0041");
  });
});

describe("unescapeUnicode", () => {
  it("round-trips an emoji through both styles", () => {
    expect(unescapeUnicode(escapeUnicode("👋", "u", false))).toBe("👋");
    expect(unescapeUnicode(escapeUnicode("👋", "codepoint", false))).toBe("👋");
  });

  it("handles \\x and the common control escapes", () => {
    expect(unescapeUnicode("a\\x41\\tb\\nc")).toBe("aA\tb\nc");
  });

  it("leaves an out-of-range code point as written", () => {
    expect(unescapeUnicode("\\u{110000}")).toBe("\\u{110000}");
  });
});
