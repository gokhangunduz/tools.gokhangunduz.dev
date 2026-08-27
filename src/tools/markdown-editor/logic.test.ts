import { describe, expect, it } from "vitest";
import {
  countText,
  htmlDocument,
  indentLines,
  renderMarkdown,
  safeUrl,
  sanitizeHtml,
  titleOf,
  wrapSelection,
} from "./logic";

describe("sanitizeHtml", () => {
  it("drops event handlers", () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe(
      '<img src="x">',
    );
    expect(sanitizeHtml("<img src=x onerror=alert(1)>")).toBe('<img src="x">');
  });

  it("drops scripts with their content", () => {
    expect(sanitizeHtml("a<script>alert(1)</script>b")).toBe("ab");
    expect(sanitizeHtml("<SCRIPT src=//evil></SCRIPT>")).toBe("");
    expect(sanitizeHtml("<style>*{}</style><iframe src=x></iframe>ok")).toBe(
      "ok",
    );
  });

  it("refuses javascript: URLs, however they are spelled", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a target="_blank" rel="noopener noreferrer">x</a>',
    );
    expect(
      sanitizeHtml('<a href="&#106;avascript:alert(1)">x</a>'),
    ).not.toContain("href");
    expect(
      sanitizeHtml('<a href=" java\tscript:alert(1)">x</a>'),
    ).not.toContain("href");
    expect(
      sanitizeHtml('<img src="data:image/svg+xml,<svg onload=alert(1)>">'),
    ).toBe("<img>");
  });

  it("keeps the tags GitHub allows", () => {
    expect(
      sanitizeHtml("<details open><summary>Aç</summary>içerik</details>"),
    ).toBe("<details open><summary>Aç</summary>içerik</details>");
    expect(sanitizeHtml("<kbd>⌘</kbd>+<kbd>K</kbd>")).toBe(
      "<kbd>⌘</kbd>+<kbd>K</kbd>",
    );
    expect(
      sanitizeHtml(
        '<p align="center"><img src="a.png" alt="logo" width=80></p>',
      ),
    ).toBe('<p align="center"><img src="a.png" alt="logo" width="80"></p>');
  });

  it("shows unknown markup as text, and keeps entities", () => {
    expect(sanitizeHtml("<form action=x>a &amp; b &copy; & c</form>")).toBe(
      "a &amp; b &copy; &amp; c",
    );
    expect(sanitizeHtml("1 < 2 > 0")).toBe("1 &lt; 2 &gt; 0");
  });

  it("re-escapes attribute values", () => {
    expect(sanitizeHtml(`<img alt='"><script>x</script>'>`)).toBe(
      '<img alt="&quot;&gt;&lt;script&gt;x&lt;/script&gt;">',
    );
  });
});

describe("safeUrl", () => {
  it("allows web, mail and relative URLs", () => {
    expect(safeUrl("https://a.dev", "link")).toBe("https://a.dev");
    expect(safeUrl("mailto:a@b.c", "link")).toBe("mailto:a@b.c");
    expect(safeUrl("#top", "link")).toBe("#top");
    expect(safeUrl("./img.png", "image")).toBe("./img.png");
    expect(safeUrl("data:image/png;base64,AAA", "image")).not.toBeNull();
  });

  it("refuses script and data URLs", () => {
    expect(safeUrl("JavaScript:alert(1)", "link")).toBeNull();
    expect(safeUrl("vbscript:x", "link")).toBeNull();
    expect(safeUrl("data:text/html,<b>", "link")).toBeNull();
    expect(safeUrl("mailto:a@b.c", "image")).toBeNull();
  });
});

describe("renderMarkdown", () => {
  it("renders GFM and opens links in a new tab", async () => {
    const html = await renderMarkdown(
      "# Başlık\n\n[site](https://a.dev)\n\n- [x] iş",
    );
    expect(html).toContain("<h1>Başlık</h1>");
    expect(html).toContain(
      '<a href="https://a.dev" target="_blank" rel="noopener noreferrer">site</a>',
    );
    expect(html).toContain('type="checkbox"');
  });

  it("closes the onerror hole", async () => {
    const html = await renderMarkdown(
      'hi <img src=x onerror="alert(1)">\n\n<div onclick="x()">a</div>',
    );
    expect(html).not.toMatch(/onerror|onclick/);
    expect(html).toContain('<img src="x">');
  });

  it("drops javascript: links but keeps their text", async () => {
    const html = await renderMarkdown(
      "[tıkla](javascript:alert(1)) ![p](javascript:x)",
    );
    expect(html).not.toContain("javascript");
    expect(html).toContain("tıkla");
  });

  it("returns nothing for blank input", async () => {
    expect(await renderMarkdown("  \n")).toBe("");
  });
});

describe("indentLines", () => {
  it("indents every selected line and keeps the selection on them", () => {
    const text = "a\nb\nc";
    expect(indentLines(text, 0, 3, false)).toEqual({
      text: "  a\n  b\nc",
      start: 2,
      end: 7,
    });
  });

  it("outdents", () => {
    expect(indentLines("  a\n b\nc", 0, 6, true)).toEqual({
      text: "a\nb\nc",
      start: 0,
      end: 3,
    });
  });

  it("inserts two spaces at a caret", () => {
    expect(indentLines("ab", 1, 1, false)).toEqual({
      text: "a  b",
      start: 3,
      end: 3,
    });
  });
});

describe("wrapSelection", () => {
  it("wraps and unwraps bold", () => {
    const bold = wrapSelection("a word", 2, 6, "bold");
    expect(bold).toEqual({ text: "a **word**", start: 4, end: 8 });
    expect(wrapSelection(bold.text, bold.start, bold.end, "bold")).toEqual({
      text: "a word",
      start: 2,
      end: 6,
    });
  });

  it("makes a link and selects the URL", () => {
    const link = wrapSelection("see docs", 4, 8, "link");
    expect(link.text).toBe("see [docs](https://)");
    expect(link.text.slice(link.start, link.end)).toBe("https://");
  });

  it("uses the placeholder label with no selection", () => {
    const link = wrapSelection("", 0, 0, "link", "metin");
    expect(link.text).toBe("[metin](https://)");
    expect(link.text.slice(link.start, link.end)).toBe("metin");
  });
});

describe("helpers", () => {
  it("counts words, characters and lines", () => {
    expect(countText("Merhaba dünya\n\n- iş 2")).toEqual({
      words: 4,
      chars: 21,
      lines: 3,
    });
    expect(countText("")).toEqual({ words: 0, chars: 0, lines: 0 });
  });

  it("titles a page after its first heading", () => {
    expect(titleOf("intro\n## **Kurulum** ##\n")).toBe("Kurulum");
    expect(titleOf("no heading")).toBe("Markdown");
  });

  it("builds a full page with an escaped title", () => {
    const page = htmlDocument("<x>", "<p>a</p>");
    expect(page).toContain("<title>&lt;x&gt;</title>");
    expect(page).toContain("<p>a</p>");
  });
});
