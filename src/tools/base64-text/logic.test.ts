import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64 } from "./logic";

const plain = { urlSafe: false, wrap: false };

describe("encodeBase64", () => {
  it("encodes ASCII", () => {
    expect(encodeBase64("hello", plain)).toBe("aGVsbG8=");
  });

  it("encodes UTF-8 rather than Latin-1", () => {
    // btoa("Şükrü") throws; the whole point of the TextEncoder path.
    expect(encodeBase64("Şükrü", plain)).toBe("xZ7DvGtyw7w=");
  });

  it("round-trips emoji", () => {
    expect(decodeBase64(encodeBase64("🔐 ok", plain))).toBe("🔐 ok");
  });

  it("drops padding and swaps the alphabet when url-safe", () => {
    const value = encodeBase64("??>>", { urlSafe: true, wrap: false });
    expect(value).not.toMatch(/[+/=]/);
    expect(decodeBase64(value)).toBe("??>>");
  });

  it("wraps at 76 characters", () => {
    const lines = encodeBase64("a".repeat(120), { urlSafe: false, wrap: true })
      .split("\n")
      .filter(Boolean);
    // 120 bytes encode to 160 characters: two full lines and a remainder.
    expect(lines[0]).toHaveLength(76);
    expect(lines.length).toBe(3);
    expect(lines.at(-1)).toHaveLength(8);
  });

  it("returns empty for empty input", () => {
    expect(encodeBase64("", plain)).toBe("");
  });
});

describe("decodeBase64", () => {
  it("ignores whitespace and newlines", () => {
    expect(decodeBase64("aGVs\nbG8 =")).toBe("hello");
  });

  it("accepts input without padding", () => {
    expect(decodeBase64("aGVsbG8")).toBe("hello");
  });

  it("rejects characters outside the alphabet", () => {
    expect(() => decodeBase64("not base64!")).toThrow();
  });

  it("rejects bytes that are not UTF-8 text", () => {
    // 0xFF is never a valid UTF-8 lead byte.
    expect(() => decodeBase64("/w==")).toThrow();
  });
});
