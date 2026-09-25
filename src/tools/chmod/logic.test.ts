import { describe, expect, it } from "vitest";
import { describeMode, readMode } from "./logic";

describe("readMode", () => {
  it("reads octal", () => {
    expect(readMode("755")).toBe(0o755);
    expect(readMode("0644")).toBe(0o644);
  });

  it("reads the symbolic form", () => {
    expect(readMode("rwxr-xr-x")).toBe(0o755);
    expect(readMode("rw-r--r--")).toBe(0o644);
  });

  it("reads what ls -l prints, leading type character and all", () => {
    expect(readMode("drwxr-xr-x")).toBe(0o755);
  });

  it("rejects a symbolic string whose letters are in the wrong place", () => {
    expect(() => readMode("rwxrwxrwr")).toThrow();
  });

  it("rejects anything else", () => {
    expect(() => readMode("chmod -R")).toThrow();
  });
});

describe("describeMode", () => {
  it("prints both notations and what each digit means", () => {
    const output = describeMode("755");
    expect(output).toContain("rwxr-xr-x");
    expect(output).toContain("chmod 755");
    expect(output).toContain("read + write + execute");
    expect(output).toContain("read + execute");
  });

  it("converts from symbolic back to octal", () => {
    expect(describeMode("rw-------")).toContain("600");
  });

  it("returns empty for blank input", () => {
    expect(describeMode("  ")).toBe("");
  });
});
