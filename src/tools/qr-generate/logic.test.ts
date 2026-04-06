import { describe, expect, it } from "vitest";
import { toSvg } from "./logic";

describe("toSvg", () => {
  it("produces an SVG with a viewBox", async () => {
    const svg = await toSvg("https://gokhangunduz.dev", "M", 2);
    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
  });

  it("encodes Turkish text", async () => {
    const svg = await toSvg("Şükrü'nün kartı", "M", 2);
    expect(svg).toContain("<svg");
  });

  it("gets denser with a higher correction level", async () => {
    const low = await toSvg("x".repeat(200), "L", 2);
    const high = await toSvg("x".repeat(200), "H", 2);
    const size = (svg: string) => Number(/viewBox="0 0 (\d+)/.exec(svg)![1]);
    expect(size(high)).toBeGreaterThan(size(low));
  });

  it("explains a payload that will not fit", async () => {
    await expect(toSvg("x".repeat(3000), "H", 2)).rejects.toThrow(/too long/);
  });

  it("returns empty for blank input", async () => {
    expect(await toSvg("  ", "M", 2)).toBe("");
  });
});
