import { describe, expect, it } from "vitest";
import { decodeForm, decodeUrl, encodeUrl } from "./logic";

describe("encodeUrl", () => {
  it("escapes the characters that would change a URL's structure", () => {
    expect(encodeUrl("a&b=c/d?e", false)).toBe("a%26b%3Dc%2Fd%3Fe");
  });

  it("leaves that structure alone when encoding a whole URL", () => {
    expect(encodeUrl("https://x.dev/a b?q=1&r=2", true)).toBe(
      "https://x.dev/a%20b?q=1&r=2",
    );
  });

  it("encodes non-ASCII as UTF-8 bytes", () => {
    expect(encodeUrl("ç", false)).toBe("%C3%A7");
  });
});

describe("decodeUrl", () => {
  it("round-trips Turkish text", () => {
    expect(decodeUrl(encodeUrl("Şükrü & Ayşe", false), false)).toBe(
      "Şükrü & Ayşe",
    );
  });

  it("rejects a truncated escape rather than returning it raw", () => {
    expect(() => decodeUrl("%A", false)).toThrow();
    expect(() => decodeUrl("100%", false)).toThrow();
  });
});

describe("decodeForm", () => {
  it("reads + as a space", () => {
    expect(decodeForm("a+b%20c")).toBe("a b c");
  });
});
