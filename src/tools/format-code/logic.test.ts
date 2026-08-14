import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import { changedLines, detectLanguage, formatCode, formatError } from "./logic";

const base = {
  width: 80,
  tabWidth: 2,
  semi: true,
  singleQuote: false,
} as const;

describe("formatCode", () => {
  it("formats JavaScript", async () => {
    const output = await formatCode("const a={b:1,c:[1,2,3]}", {
      ...base,
      language: "javascript",
    });
    expect(output).toBe("const a = { b: 1, c: [1, 2, 3] };\n");
  });

  it("honours the quote and semicolon options", async () => {
    const output = await formatCode(`const a = "x"`, {
      ...base,
      language: "javascript",
      semi: false,
      singleQuote: true,
    });
    expect(output).toBe("const a = 'x'\n");
  });

  it("formats TypeScript, which the babel parser would reject", async () => {
    const output = await formatCode("type A={a:string}", {
      ...base,
      language: "typescript",
    });
    expect(output).toContain("type A = { a: string }");
  });

  it("formats JSON, CSS and YAML", async () => {
    expect(
      await formatCode('{"a":1}', { ...base, language: "json" }),
    ).toContain('"a": 1');
    expect(
      await formatCode("a{color:red}", { ...base, language: "css" }),
    ).toContain("color: red;");
    expect(await formatCode("a:   1", { ...base, language: "yaml" })).toBe(
      "a: 1\n",
    );
  });

  it("reports a syntax error with its position rather than throwing raw", async () => {
    await expect(
      formatCode("const a = {", { ...base, language: "javascript" }),
    ).rejects.toThrow(/Could not parse/);
  });

  it("localizes the error and points at it", async () => {
    const error = await formatCode("const a = {\nfoo(", {
      ...base,
      language: "javascript",
    }).catch((cause) => cause);
    expect(error).toBeInstanceOf(ToolError);
    expect(error.detail).toEqual({
      tr: "Parse edilemedi: beklenmeyen token",
      en: "Could not parse: unexpected token",
    });
    expect(error.at).toEqual({ line: 2, column: 5 });
    expect(error.localized.en).not.toContain(">");
  });

  it("keeps the position but not the raw text of an unknown parser message", () => {
    const error = formatError({
      message: "Something odd (3:4)\n> 3 | x",
      loc: { start: { line: 3, column: 4 } },
    });
    expect(error.detail.en).toBe("Could not parse");
    expect(error.at).toEqual({ line: 3, column: 4 });
  });

  it("indents with tabs and honours the trailing comma option", async () => {
    const source =
      "const a = {bbbbbbbbbbbb: 1, cccccccccccc: 2, dddddddddddd: 3, eeeeeeeeeeee: 4}";
    const tabs = await formatCode(source, {
      ...base,
      language: "javascript",
      useTabs: true,
    });
    expect(tabs).toContain("\n\tbbbbbbbbbbbb: 1,");
    expect(tabs).toContain("eeeeeeeeeeee: 4,\n");
    const none = await formatCode(source, {
      ...base,
      language: "javascript",
      trailingComma: "none",
    });
    expect(none).toContain("eeeeeeeeeeee: 4\n");
  });

  it("returns empty for blank input", async () => {
    expect(await formatCode("   ", { ...base, language: "javascript" })).toBe(
      "",
    );
  });
});

describe("detectLanguage", () => {
  it.each([
    ['{"a": 1}', "json"],
    ["[1, 2]", "json"],
    ['{\n  "a": 1,\n}', "json"],
    ["<div><p>x</p></div>", "html"],
    [
      "<template><div/></template>\n<script setup>\nconst a = 1\n</script>",
      "vue",
    ],
    ["---\ntitle: x", "yaml"],
    ["name: app\nversion: 2\nitems:\n  - a\n  - b", "yaml"],
    ["query { user(id: 1) { name } }", "graphql"],
    ["type Query {\n  user: User\n}", "graphql"],
    ["a { color: red; }", "css"],
    [".card{padding:0;margin:0}", "css"],
    [".a{color:red}", "css"],
    ["h1 { margin: 0 }", "css"],
    ["@media (min-width: 1px) { a { b: c } }", "css"],
    ["# Title\n\nSome *text*.", "markdown"],
    ["- one\n- two", "markdown"],
    ["type A = { a: string }", "typescript"],
    ["interface A {\n  a: string;\n}", "typescript"],
    ["export interface A { a: string }", "typescript"],
    ["do { a: 1 } while (x)", "javascript"],
    ["function f(a: number): void {}", "typescript"],
    ["const a = { b: 1 }", "javascript"],
    ["if (a) { b: 1 }", "javascript"],
    ["{ a: 1 }", "javascript"],
  ])("%s → %s", (input, language) => {
    expect(detectLanguage(input)).toBe(language);
  });
});

describe("changedLines", () => {
  it("is zero when the output is the input", () => {
    expect(changedLines("const a = 1;\n", "const a = 1;\n")).toBe(0);
    expect(changedLines("const a = 1;", "const a = 1;\n")).toBe(0);
    expect(changedLines("a\r\nb", "a\nb\n")).toBe(0);
  });

  it("counts the output lines that were not in the input", () => {
    expect(changedLines("const a={b:1}", "const a = { b: 1 };\n")).toBe(1);
    expect(changedLines("a\nb\nc", "a\nB\nc\nd")).toBe(2);
  });
});
