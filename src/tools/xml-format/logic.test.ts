import { describe, expect, it } from "vitest";
import { formatXml, minifyXml } from "./logic";

describe("formatXml", () => {
  it("indents nested elements", async () => {
    const output = await formatXml("<a><b>1</b><c x='2'>3</c></a>");
    expect(output.split("\n").length).toBeGreaterThan(3);
    expect(output).toContain("  <b>1</b>");
    expect(output).toContain('x="2"');
  });

  it("keeps a value that only looks like a number", async () => {
    // "007" must not come back as 7.
    expect(await formatXml("<a><code>007</code></a>")).toContain("007");
  });

  it("rejects malformed input rather than reformatting it", async () => {
    await expect(formatXml("<a><b></a>")).rejects.toThrow();
    await expect(formatXml("not xml at all")).rejects.toThrow();
  });

  it("returns empty for blank input", async () => {
    expect(await formatXml("   ")).toBe("");
  });
});

describe("minifyXml", () => {
  it("removes the whitespace between elements", async () => {
    const output = await minifyXml("<a>\n  <b>1</b>\n</a>");
    expect(output).toBe("<a><b>1</b></a>");
  });
});
