import { describe, expect, it } from "vitest";
import { hashAll, hashText } from "./logic";

describe("hashText", () => {
  it("matches the known digests of the empty-ish canonical input", async () => {
    // `echo -n abc | md5sum` and friends.
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
    // sha256 of the two bytes c3 a7, not of a UTF-16 code unit.
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
  it("lists every algorithm with its digest", async () => {
    const output = await hashAll("abc", false);
    expect(output).toContain("md5");
    expect(output).toContain("900150983cd24fb0d6963f7d28e17f72");
    expect(output.split("\n")).toHaveLength(8);
  });
});
