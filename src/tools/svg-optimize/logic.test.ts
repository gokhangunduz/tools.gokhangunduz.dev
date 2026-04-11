import { describe, expect, it } from "vitest";
import { optimizeSvg, savingLine } from "./logic";

const EXPORTED = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Some Editor 26.0 -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <title>icon</title>
  <g id="layer1">
    <path d="M 12.000000 2.0000000 L 22.00000 22.000000 L 2.0000000 22.00000 Z" fill="#ff0000"/>
  </g>
</svg>`;

const base = { precision: 2, removeIds: false, removeDimensions: false };

describe("optimizeSvg", () => {
  it("strips the editor's noise and shortens the numbers", async () => {
    const output = await optimizeSvg(EXPORTED, base);
    expect(output).not.toContain("Generator");
    expect(output).not.toContain("<?xml");
    expect(output).not.toContain("12.000000");
    expect(output.length).toBeLessThan(EXPORTED.length * 0.6);
  });

  it("keeps the viewBox, without which the icon stops scaling", async () => {
    expect(await optimizeSvg(EXPORTED, base)).toContain("viewBox");
  });

  it("keeps ids by default, so a sprite's <use> keeps working", async () => {
    expect(await optimizeSvg(EXPORTED, base)).toContain("layer1");
    expect(
      await optimizeSvg(EXPORTED, { ...base, removeIds: true }),
    ).not.toContain("layer1");
  });

  it("can drop width and height for a responsive icon", async () => {
    const output = await optimizeSvg(EXPORTED, {
      ...base,
      removeDimensions: true,
    });
    expect(output).not.toMatch(/width="24"/);
    expect(output).toContain("viewBox");
  });

  it("refuses input that is not an SVG", async () => {
    await expect(optimizeSvg("<div>x</div>", base)).rejects.toThrow();
  });

  it("returns empty for blank input", async () => {
    expect(await optimizeSvg("  ", base)).toBe("");
  });
});

describe("savingLine", () => {
  it("reports the saving", () => {
    expect(savingLine("aaaa", "aa")).toBe("4 B → 2 B (-50%)");
  });
});
