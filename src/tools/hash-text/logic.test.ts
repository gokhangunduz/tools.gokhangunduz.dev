import { describe, expect, it } from "vitest";
import {
  ALGORITHMS,
  ALGORITHM_NAMES,
  findMatch,
  formatDigests,
  hasTrailingNewline,
  hashAll,
  hashText,
  stripTrailingNewlines,
  utf8Length,
} from "./logic";

describe("hashText", () => {
  it("matches the known digests of the empty-ish canonical input", async () => {
    expect(await hashText("abc", "md5", false)).toBe(
      "900150983cd24fb0d6963f7d28e17f72",
    );
    expect(await hashText("abc", "sha1", false)).toBe(
      "a9993e364706816aba3e25717850c26c9cd0d89d",
    );
    expect(await hashText("abc", "sha256", false)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("hashes the UTF-8 bytes of non-ASCII text", async () => {
    expect(await hashText("ç", "sha256", false)).toBe(
      "8bfa829b8119a6f39b91fd8decec63830b556e4d88a9da29334d7b0558829f2d",
    );
  });

  it("uppercases when asked", async () => {
    expect(await hashText("abc", "md5", true)).toBe(
      "900150983CD24FB0D6963F7D28E17F72",
    );
  });

  it("returns empty for empty input", async () => {
    expect(await hashText("", "sha256", false)).toBe("");
  });
});

describe("hashAll", () => {
  it("lists every algorithm under its canonical name", async () => {
    const digests = await hashAll("abc", false);
    expect(digests.map((d) => d.name)).toEqual([
      "MD5",
      "SHA-1",
      "SHA-256",
      "SHA-384",
      "SHA-512",
      "SHA3-256",
      "SHA3-512",
      "CRC32",
    ]);
    expect(digests[0].value).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(digests.at(-1)?.value).toBe("352441c2");
  });

  it("has a display name for every algorithm", () => {
    for (const algorithm of ALGORITHMS) {
      expect(ALGORITHM_NAMES[algorithm]).toBeTruthy();
    }
  });

  it("returns nothing for empty input", async () => {
    expect(await hashAll("", false)).toEqual([]);
  });

  it("formats as aligned lines for copying", async () => {
    const text = formatDigests(await hashAll("abc", false));
    expect(text.split("\n")).toHaveLength(8);
    expect(text).toContain("MD5       900150983cd24fb0d6963f7d28e17f72");
  });
});

describe("findMatch", () => {
  it("finds the algorithm ignoring case and surrounding space", async () => {
    const digests = await hashAll("abc", false);
    expect(
      findMatch(digests, "  A9993E364706816ABA3E25717850C26C9CD0D89D\n"),
    ).toBe("sha1");
  });

  it("returns null for no match or an empty value", async () => {
    const digests = await hashAll("abc", false);
    expect(findMatch(digests, "deadbeef")).toBeNull();
    expect(findMatch(digests, "   ")).toBeNull();
  });
});

describe("trailing newline", () => {
  it("is detected, and changes the digest", async () => {
    expect(hasTrailingNewline("abc\n")).toBe(true);
    expect(hasTrailingNewline("abc\r\n")).toBe(true);
    expect(hasTrailingNewline("a\nbc")).toBe(false);
    expect(await hashText("abc\n", "md5", false)).not.toBe(
      await hashText("abc", "md5", false),
    );
  });

  it("is removed, however many there are", () => {
    expect(stripTrailingNewlines("abc\r\n\n")).toBe("abc");
    expect(stripTrailingNewlines("a\nb")).toBe("a\nb");
  });
});

describe("utf8Length", () => {
  it("counts bytes, not characters", () => {
    expect(utf8Length("Merhaba dünya")).toBe(14);
  });
});
