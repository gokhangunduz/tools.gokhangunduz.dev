import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import { ensureImage, isSvg, sizeNote, svgDataUri, wrapDataUrl } from "./logic";

const URL = "data:image/png;base64,iVBORw0KGgo=";

describe("ensureImage", () => {
  it("rejects a text file and names its type", () => {
    expect(() => ensureImage({ type: "text/plain", name: "a.txt" })).toThrow(
      ToolError,
    );
    try {
      ensureImage({ type: "text/plain", name: "a.txt" });
    } catch (error) {
      expect((error as ToolError).localized.tr).toContain("(text/plain)");
    }
  });

  it("accepts images", () => {
    expect(() =>
      ensureImage({ type: "image/png", name: "a.png" }),
    ).not.toThrow();
  });
});

describe("wrapDataUrl", () => {
  it("wraps in every format", () => {
    expect(wrapDataUrl(URL, "raw")).toBe(URL);
    expect(wrapDataUrl(URL, "base64")).toBe("iVBORw0KGgo=");
    expect(wrapDataUrl(URL, "css")).toBe(`background-image: url("${URL}");`);
    expect(wrapDataUrl(URL, "img")).toBe(`<img src="${URL}" alt="">`);
    expect(wrapDataUrl(URL, "jsx")).toBe(`<img src="${URL}" alt="" />`);
    expect(wrapDataUrl(URL, "markdown")).toBe(`![](${URL})`);
  });
});

describe("svgDataUri", () => {
  it("collapses whitespace, swaps quotes and escapes what must be", () => {
    const uri = svgDataUri(
      '<svg xmlns="http://www.w3.org/2000/svg">\n  <path fill="#000" d="M0 0h1"/>\n</svg>\n',
    );
    expect(uri).toBe(
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23000' d='M0 0h1'/%3E%3C/svg%3E",
    );
  });

  it("keeps double quotes when the markup has single ones", () => {
    const uri = svgDataUri(`<svg><text font-family="'Geist'">a</text></svg>`);
    expect(uri).toContain("%22'Geist'%22");
  });

  it("round-trips through decodeURIComponent", () => {
    const svg = "<svg><text>Şükrü & 100%</text></svg>";
    const uri = svgDataUri(svg);
    expect(decodeURIComponent(uri.slice(uri.indexOf(",") + 1))).toBe(svg);
  });
});

describe("isSvg", () => {
  it("uses the type or the extension", () => {
    expect(isSvg({ type: "image/svg+xml", name: "a" })).toBe(true);
    expect(isSvg({ type: "", name: "icon.SVG" })).toBe(true);
    expect(isSvg({ type: "image/png", name: "a.png" })).toBe(false);
  });
});

describe("sizeNote", () => {
  it("is neutral for a small icon", () => {
    const note = sizeNote(900, "x".repeat(1200));
    expect(note.warn).toBe(false);
    expect(note.text.tr).toContain("+%33");
    expect(note.text.en).toContain("+33%");
  });

  it("warns past 10 KB, measured on the wrapped output", () => {
    const note = sizeNote(8000, "x".repeat(10_700));
    expect(note.warn).toBe(true);
    expect(note.text.tr).toContain("ayrı dosya");
    expect(note.text.en).toContain("separate file");
  });
});
