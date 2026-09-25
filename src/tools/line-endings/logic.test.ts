import { describe as group, expect, it } from "vitest";
import { convert, count, describe } from "./logic";

group("convert", () => {
  it("converts LF to CRLF and back", () => {
    expect(convert("a\nb", "crlf")).toBe("a\r\nb");
    expect(convert("a\r\nb", "lf")).toBe("a\nb");
  });

  it("does not double up when converting CRLF to CRLF", () => {
    expect(convert("a\r\nb", "crlf")).toBe("a\r\nb");
  });

  it("normalises mixed endings to one kind", () => {
    expect(convert("a\r\nb\nc\rd", "lf")).toBe("a\nb\nc\nd");
  });

  it("returns empty for empty input", () => {
    expect(convert("", "lf")).toBe("");
  });
});

group("count", () => {
  it("counts each kind separately", () => {
    expect(count("a\r\nb\nc\rd")).toEqual({ crlf: 1, lf: 1, cr: 1 });
  });

  it("does not count the LF inside a CRLF twice", () => {
    expect(count("a\r\nb")).toEqual({ crlf: 1, lf: 0, cr: 0 });
  });
});

group("describe", () => {
  it("warns about mixed endings", () => {
    expect(describe("a\r\nb\nc", "en")).toContain("Mixed line endings");
  });

  it("does not warn when the file is consistent", () => {
    expect(describe("a\nb\nc", "en")).not.toContain("Mixed");
  });

  it("reports text with no line endings at all", () => {
    expect(() => describe("tek sat\u0131r", "en")).toThrow();
  });
});
