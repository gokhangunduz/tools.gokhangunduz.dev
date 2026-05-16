import { describe, expect, it } from "vitest";
import { looksMangled, repair } from "./logic";

/** Mangles text the way a wrong decode does, to build the test inputs. */
function mangle(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return new TextDecoder("windows-1252").decode(bytes);
}

describe("repair", () => {
  it("repairs Turkish text mangled through Windows-1252", () => {
    const original =
      "\u015e\u00fckr\u00fc'n\u00fcn \u00e7a\u011fr\u0131s\u0131";
    const broken = mangle(original);
    expect(broken).not.toBe(original);
    expect(repair(broken, "windows-1252")).toBe(original);
  });

  it("repairs the cases people actually paste", () => {
    expect(repair("\u00c3\u00bc", "windows-1252")).toBe("\u00fc");
    expect(repair("\u00c5\u0178", "windows-1252")).toBe("\u015f");
    expect(repair("\u00e2\u20ac\u2122", "windows-1252")).toBe("\u2019");
  });

  it("repairs text mangled through ISO-8859-9", () => {
    const original = "\u0130stanbul Bo\u011faz\u0131";
    const bytes = new TextEncoder().encode(original);
    const map: Record<number, string> = {
      0xd0: "\u011e",
      0xdd: "\u0130",
      0xde: "\u015e",
      0xf0: "\u011f",
      0xfd: "\u0131",
      0xfe: "\u015f",
    };
    const broken = Array.from(
      bytes,
      (byte) => map[byte] ?? String.fromCharCode(byte),
    ).join("");
    expect(repair(broken, "iso-8859-9")).toBe(original);
  });

  it("refuses text that cannot have come from this mistake", () => {
    expect(() => repair("\u6b63\u3057\u3044", "windows-1252")).toThrow();
  });

  it("reports bytes that do not decode as UTF-8", () => {
    expect(() => repair("\u00ff\u00ff", "windows-1252")).toThrow(
      /not valid UTF-8/,
    );
  });

  it("returns empty for empty input", () => {
    expect(repair("", "windows-1252")).toBe("");
  });
});

describe("looksMangled", () => {
  it("recognises the signature", () => {
    expect(looksMangled(mangle("\u015e\u00fckr\u00fc"))).toBe(true);
    expect(looksMangled("\u015e\u00fckr\u00fc")).toBe(false);
  });
});
