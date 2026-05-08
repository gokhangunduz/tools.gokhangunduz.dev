import { describe, expect, it } from "vitest";
import { clean, findAll } from "./logic";

describe("clean", () => {
  it("removes a BOM, which breaks JSON.parse on the first character", () => {
    expect(clean("\ufeff{}", false)).toBe("{}");
  });

  it("removes zero-width characters", () => {
    expect(clean("pa\u200bss", false)).toBe("pass");
  });

  it("turns a no-break space into a space", () => {
    expect(clean("a\u00a0b", false)).toBe("a b");
  });

  it("straightens typographic punctuation", () => {
    expect(
      clean(
        "\u201cal\u0131nt\u0131\u201d \u2014 \u2018i\u00e7\u2019\u2026",
        false,
      ),
    ).toBe("\"al\u0131nt\u0131\" - 'i\u00e7'...");
  });

  it("can keep the punctuation and still remove the invisibles", () => {
    expect(clean("\u201cx\u201d\u200b", true)).toBe("\u201cx\u201d");
  });

  it("leaves ordinary text alone", () => {
    expect(clean("Merhaba d\u00fcnya", false)).toBe("Merhaba d\u00fcnya");
  });
});

describe("findAll", () => {
  it("counts what it found, by kind", () => {
    const output = findAll("a\u00a0b\u200bc\u200b", "en");
    expect(output).toMatch(/zero-width character\s+2/);
    expect(output).toMatch(/no-break space\s+1/);
  });

  it("says plainly when there is nothing", () => {
    expect(findAll("temiz metin", "en")).toContain("No hidden");
  });
});
