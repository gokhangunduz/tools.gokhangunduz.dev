import { describe, expect, it } from "vitest";
import { minify, savingLine } from "./logic";

describe("minify", () => {
  it("collapses JSON and validates it on the way", async () => {
    expect(await minify('{\n  "a": [1, 2]\n}', "json")).toBe('{"a":[1,2]}');
    await expect(minify("{oops}", "json")).rejects.toThrow();
  });

  it("collapses CSS", async () => {
    const output = await minify("a {\n  color: red;\n  margin: 0;\n}", "css");
    expect(output).toBe("a{color:red;margin:0}");
  });

  it("leaves the inside of a CSS string alone", async () => {
    const output = await minify('a::after { content: "a: b, c"; }', "css");
    expect(output).toContain('"a: b, c"');
  });

  it("minifies JavaScript without touching string contents", async () => {
    const output = await minify(
      'const message = "a: b, c";\n// a comment\nconst n = 1;',
      "javascript",
    );
    expect(output).toContain('"a: b, c"');
    expect(output).not.toContain("a comment");
    expect(output).not.toContain("\n");
  });

  it("keeps identifiers readable rather than mangling them", async () => {
    const output = await minify(
      "function addTwoNumbers(first, second) { return first + second; }",
      "javascript",
    );
    expect(output).toContain("addTwoNumbers");
  });

  it("reports broken CSS rather than silently dropping the rule", async () => {
    // css-tree recovers from this by discarding the declaration; without the
    // check, the tool would answer an empty string.
    await expect(minify("a { color:", "css")).rejects.toThrow();
    await expect(minify("a{color:red} @@@ b{x}", "css")).rejects.toThrow();
  });

  it("reports a JavaScript syntax error instead of emitting broken output", async () => {
    await expect(minify("const a = {", "javascript")).rejects.toThrow();
  });

  it("returns empty for blank input", async () => {
    expect(await minify("  ", "css")).toBe("");
  });
});

describe("savingLine", () => {
  it("reports the size before and after", () => {
    expect(savingLine("aaaa", "aa")).toBe("4 B → 2 B (-50%)");
  });
});
