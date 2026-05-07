import { describe, expect, it } from "vitest";
import { AVAILABLE, build } from "./logic";

describe("build", () => {
  it("writes a labelled section per stack", () => {
    const output = build("node, next");
    expect(output).toContain("# Node");
    expect(output).toContain("node_modules/");
    expect(output).toContain("# Next.js");
    expect(output).toContain(".next/");
  });

  it("does not repeat a pattern two stacks share", () => {
    const output = build("rust, java");
    expect(output.match(/^target\/$/gm)).toHaveLength(1);
  });

  it("names what it knows when given something it does not", () => {
    expect(() => build("cobol")).toThrow(/Available/);
  });

  it("asks for at least one section", () => {
    expect(() => build("   ")).toThrow();
  });

  it("supports every advertised section", () => {
    expect(() => build(AVAILABLE.join(","))).not.toThrow();
  });

  it("ends with a newline, as a text file should", () => {
    expect(build("node").endsWith("\n")).toBe(true);
  });
});
