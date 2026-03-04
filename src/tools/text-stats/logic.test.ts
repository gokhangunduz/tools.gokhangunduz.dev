import { describe, expect, it } from "vitest";
import { analyze } from "./logic";

function value(output: string, label: string): number {
  const line = output.split("\n").find((row) => row.startsWith(label));
  return Number(line?.split(/\s{2,}/)[1]);
}

describe("analyze", () => {
  it("counts an emoji as one character but four bytes", () => {
    const output = analyze("👋", "tr");
    expect(value(output, "karakter")).toBe(1);
    expect(value(output, "UTF-16")).toBe(2);
    expect(value(output, "bayt")).toBe(4);
  });

  it("counts a family emoji as one grapheme", () => {
    const output = analyze("👨‍👩‍👧", "tr");
    expect(value(output, "karakter")).toBe(1);
    expect(value(output, "kod noktası")).toBeGreaterThan(1);
  });

  it("counts words, lines and sentences", () => {
    const output = analyze("Bir cümle. İkinci cümle!\nÜçüncü satır", "tr");
    expect(value(output, "kelime")).toBe(6);
    expect(value(output, "satır")).toBe(2);
    expect(value(output, "cümle")).toBe(2);
  });

  it("counts paragraphs separated by a blank line", () => {
    expect(value(analyze("bir\n\niki\n\nüç", "tr"), "paragraf")).toBe(3);
  });

  it("counts Turkish letters as letters", () => {
    expect(value(analyze("Şükrü", "tr"), "harf")).toBe(5);
  });

  it("returns empty for empty input", () => {
    expect(analyze("", "tr")).toBe("");
  });
});
