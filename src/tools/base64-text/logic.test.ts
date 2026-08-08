import { describe, expect, it } from "vitest";
import {
  decodeBase64,
  encodeBase64,
  sizeHeadline,
  sniffBinary,
  decodeBytes,
} from "./logic";
import { ToolError } from "../text-tool";

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

  it("does not end a wrapped value with a line break", () => {
    const value = encodeBase64("a".repeat(57), { urlSafe: false, wrap: true });
    expect(value).toHaveLength(76);
    expect(value).not.toContain("\n");
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

  it("strips a data URL prefix", () => {
    expect(decodeBase64("data:text/plain;charset=utf-8;base64,aGVsbG8=")).toBe(
      "hello",
    );
  });

  it("points at the first invalid character", () => {
    try {
      decodeBase64("aGVsbG8:d29y");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      const failure = error as ToolError;
      expect(failure.detail.tr).toContain('":"');
      expect(failure.at).toEqual({ line: 1, column: 8 });
    }
  });

  it("rejects padding in the middle", () => {
    expect(() => decodeBase64("aGVs=bG8")).toThrow(ToolError);
  });

  it("rejects a length that cannot be Base64", () => {
    expect(() => decodeBase64("aGVsb")).toThrow(/length/);
  });

  it("names a PNG instead of printing noise", () => {
    expect(() => decodeBase64("iVBORw0KGgoAAAANSUhEUg==")).toThrow(/PNG/);
  });

  it("shows a hex preview of other binary data", () => {
    expect(() => decodeBase64("/w==")).toThrow(/ff/);
  });
});

describe("sniffBinary", () => {
  it("recognizes the common magic numbers", () => {
    expect(sniffBinary(decodeBytes("/9j/4AAQ"))).toBe("JPEG");
    expect(sniffBinary(decodeBytes("JVBERi0x"))).toBe("PDF");
    expect(sniffBinary(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe("sizeHeadline", () => {
  it("reports growth when encoding", () => {
    const input = "Merhaba dünya 👋";
    const headline = sizeHeadline("encode", input, encodeBase64(input, plain));
    expect(headline?.tr).toBe("19 bayt → 28 karakter (+%47)");
    expect(headline?.en).toBe("19 bytes → 28 chars (+47%)");
  });

  it("reports the byte count when decoding", () => {
    expect(sizeHeadline("decode", "aGVs\nbG8=", "hello")?.tr).toBe(
      "8 karakter → 5 bayt",
    );
  });

  it("says nothing for empty output", () => {
    expect(sizeHeadline("encode", "", "")).toBeNull();
  });
});
