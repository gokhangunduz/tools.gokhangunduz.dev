import { describe, expect, it } from "vitest";
import { htmlToJsx } from "./logic";

describe("htmlToJsx", () => {
  it("renames the reserved attributes", () => {
    expect(htmlToJsx('<label class="a" for="b">x</label>')).toBe(
      '<label className="a" htmlFor="b">x</label>',
    );
  });

  it("camelCases the rest but leaves data- and aria- alone", () => {
    const output = htmlToJsx(
      '<input tabindex="1" data-id="7" aria-label="ad">',
    );
    expect(output).toContain('tabIndex="1"');
    expect(output).toContain('data-id="7"');
    expect(output).toContain('aria-label="ad"');
  });

  it("closes void elements", () => {
    expect(htmlToJsx('<img src="a.png">')).toBe('<img src="a.png" />');
    expect(htmlToJsx("<br>")).toBe("<br />");
  });

  it("turns style into an object", () => {
    expect(htmlToJsx('<div style="color: red; font-size: 12px"></div>')).toBe(
      '<div style={{ color: "red", fontSize: "12px" }}></div>',
    );
  });

  it("gives a bare boolean attribute a JSX-legal form", () => {
    expect(htmlToJsx("<input disabled>")).toBe("<input disabled />");
  });

  it("wraps comments so React does not render them", () => {
    expect(htmlToJsx("<!-- note -->")).toBe("{/* note */}");
  });

  it("leaves nested markup and text untouched", () => {
    const output = htmlToJsx('<ul class="list"><li>bir</li><li>iki</li></ul>');
    expect(output).toBe('<ul className="list"><li>bir</li><li>iki</li></ul>');
  });

  it("refuses input with no tag at all", () => {
    expect(() => htmlToJsx("just text")).toThrow();
  });

  it("returns empty for blank input", () => {
    expect(htmlToJsx("   ")).toBe("");
  });
});
