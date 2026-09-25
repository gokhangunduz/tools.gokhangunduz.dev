import { describe, expect, it } from "vitest";
import { countMatches, testRegex } from "./logic";

const TEXT = "Ali: 0532 111 22 33, Ayşe: 0545 444 55 66";

describe("testRegex", () => {
  it("lists matches with their position", () => {
    const output = testRegex(TEXT, "\\d{4}", "", "matches", "");
    expect(output).toContain("#1  @5");
    expect(output).toContain('"0532"');
  });

  it("lists numbered and named groups", () => {
    const output = testRegex(
      "2026-09-25",
      "(?<year>\\d{4})-(\\d{2})",
      "",
      "matches",
      "",
    );
    expect(output).toContain('$1  "2026"');
    expect(output).toContain('?<year>  "2026"');
  });

  it("says plainly when nothing matches", () => {
    expect(testRegex("abc", "\\d+", "", "matches", "")).toContain("No match");
  });

  it("replaces with group references", () => {
    expect(
      testRegex(
        "2026-09-25",
        "(\\d{4})-(\\d{2})-(\\d{2})",
        "",
        "replace",
        "$3.$2.$1",
      ),
    ).toBe("25.09.2026");
  });

  it("highlights matches in place", () => {
    expect(testRegex("a1b2", "\\d", "", "highlight", "")).toBe("a«1»b«2»");
  });

  it("does not hang on a zero-length match", () => {
    expect(testRegex("abc", "x*", "", "highlight", "")).toContain("«»");
  });

  it("splits on the pattern", () => {
    expect(testRegex("a, b,c", "\\s*,\\s*", "", "split", "")).toBe("a\nb\nc");
  });

  it("honours the case-insensitive flag", () => {
    expect(countMatches("AbaB", "b", "i")).toBe(2);
    expect(countMatches("AbaB", "b", "")).toBe(1);
  });

  it("reports an invalid pattern", () => {
    expect(() => testRegex("x", "(unclosed", "", "matches", "")).toThrow(
      /Invalid pattern/,
    );
  });

  it("asks for a pattern when there is none", () => {
    expect(() => testRegex("x", "", "", "matches", "")).toThrow();
  });
});
