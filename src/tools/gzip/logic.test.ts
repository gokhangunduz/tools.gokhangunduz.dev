import { describe, expect, it } from "vitest";
import { compress, decompress, ratioLine } from "./logic";

describe("compress", () => {
  it("round-trips through every format", async () => {
    const text = "Merhaba dünya ".repeat(20);
    for (const format of ["gzip", "deflate", "deflate-raw"] as const) {
      expect(await decompress(await compress(text, format), format)).toBe(text);
    }
  });

  it("actually shrinks repetitive text", async () => {
    const text = "a".repeat(2000);
    const compressed = await compress(text, "gzip");
    expect(compressed.length).toBeLessThan(text.length / 10);
  });

  it("returns empty for empty input", async () => {
    expect(await compress("", "gzip")).toBe("");
  });
});

describe("decompress", () => {
  it("rejects data compressed in another format", async () => {
    const deflated = await compress("hello", "deflate");
    await expect(decompress(deflated, "gzip")).rejects.toThrow();
  });

  it("rejects input that is not Base64 at all", async () => {
    await expect(decompress("not base64!!", "gzip")).rejects.toThrow();
  });
});

describe("ratioLine", () => {
  it("reports the saving", async () => {
    const text = "b".repeat(1000);
    expect(ratioLine(text, await compress(text, "gzip"))).toMatch(
      /1000 B → \d+ B \(-9\d%\)/,
    );
  });
});
