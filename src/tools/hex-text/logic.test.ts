import { describe, expect, it } from "vitest";
import { hexToText, textToHex } from "./logic";

describe("textToHex", () => {
  it("encodes UTF-8 bytes, not UTF-16 code units", () => {
    expect(textToHex("ç", "space", false)).toBe("c3 a7");
  });

  it("supports the separators a paste is likely to need", () => {
    expect(textToHex("AB", "none", false)).toBe("4142");
    expect(textToHex("AB", "0x", true)).toBe("0x41, 0x42");
    expect(textToHex("AB", "backslash", false)).toBe("\\x41\\x42");
  });
});

describe("hexToText", () => {
  it("accepts the separators it emits", () => {
    expect(hexToText("48 65 6c 6c 6f")).toBe("Hello");
    expect(hexToText("0x48, 0x69")).toBe("Hi");
    expect(hexToText("\\x48\\x69")).toBe("Hi");
    expect(hexToText("48-65:6c")).toBe("Hel");
  });

  it("round-trips Turkish text", () => {
    expect(hexToText(textToHex("Şükrü", "space", false))).toBe("Şükrü");
  });

  it("rejects an odd digit count", () => {
    expect(() => hexToText("48 6")).toThrow();
  });

  it("rejects non-hex characters", () => {
    expect(() => hexToText("zz")).toThrow();
  });

  it("rejects bytes that are not UTF-8", () => {
    expect(() => hexToText("ff")).toThrow();
  });
});
