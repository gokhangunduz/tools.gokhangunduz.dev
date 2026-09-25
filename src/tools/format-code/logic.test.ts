import { describe, expect, it } from "vitest";
import { formatCode } from "./logic";

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

  it("returns empty for blank input", async () => {
    expect(await formatCode("   ", { ...base, language: "javascript" })).toBe(
      "",
    );
  });
});
