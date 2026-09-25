import { describe, expect, it } from "vitest";
import { markdownToHtml } from "./logic";

describe("markdownToHtml", () => {
  it("renders headings, lists and links", async () => {
    const output = await markdownToHtml(
      "# Başlık\n\n- bir\n- iki\n\n[bağlantı](https://x.dev)",
      false,
    );
    expect(output).toContain("<h1>Başlık</h1>");
    expect(output).toContain("<li>bir</li>");
    expect(output).toContain('<a href="https://x.dev">bağlantı</a>');
  });

  it("renders GitHub tables and fenced code", async () => {
    const output = await markdownToHtml(
      "| a | b |\n|---|---|\n| 1 | 2 |\n\n```js\nconst a = 1;\n```",
      false,
    );
    expect(output).toContain("<table>");
    expect(output).toContain("<code");
  });

  it("can treat a single newline as a line break", async () => {
    expect(await markdownToHtml("a\nb", true)).toContain("<br>");
    expect(await markdownToHtml("a\nb", false)).not.toContain("<br>");
  });

  it("returns empty for blank input", async () => {
    expect(await markdownToHtml("   ", false)).toBe("");
  });
});
