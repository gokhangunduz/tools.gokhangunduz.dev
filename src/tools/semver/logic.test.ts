import { describe, expect, it } from "vitest";
import { run } from "./logic";

describe("parse", () => {
  it("breaks a version into its parts", async () => {
    const output = await run("1.2.3-beta.1+build5", "parse", "", "patch");
    expect(output).toContain("major        1");
    expect(output).toContain("prerelease   beta.1");
    expect(output).toContain("build        build5");
  });

  it("spells out what the caret allows below 1.0.0", async () => {
    // The trap: ^0.2.3 does not allow 0.3.0.
    expect(await run("0.2.3", "parse", "", "patch")).toContain(
      ">=0.2.0 <0.3.0",
    );
    expect(await run("1.2.3", "parse", "", "patch")).toContain(
      ">=1.0.0 <2.0.0",
    );
  });

  it("offers the closest reading of an invalid version", async () => {
    expect(await run("v2.3", "parse", "", "patch")).toContain("2.3.0");
  });
});

describe("satisfies", () => {
  it("marks each version against the range", async () => {
    const output = await run(
      "1.2.0\n1.9.9\n2.0.0",
      "satisfies",
      "^1.2.0",
      "patch",
    );
    expect(output).toMatch(/1\.2\.0\s+✓/);
    expect(output).toMatch(/1\.9\.9\s+✓/);
    expect(output).toMatch(/2\.0\.0\s+✗/);
  });

  it("refuses an invalid range", async () => {
    await expect(
      run("1.0.0", "satisfies", "not a range", "patch"),
    ).rejects.toThrow();
  });

  it("asks for a range when none is given", async () => {
    await expect(run("1.0.0", "satisfies", "", "patch")).rejects.toThrow();
  });
});

describe("sort", () => {
  it("sorts newest first, with prereleases below the release", async () => {
    const output = await run(
      "1.0.0\n1.10.0\n1.2.0\n2.0.0-beta",
      "sort",
      "",
      "patch",
    );
    expect(output.split("\n")).toEqual([
      "2.0.0-beta",
      "1.10.0",
      "1.2.0",
      "1.0.0",
    ]);
  });
});

describe("increment", () => {
  it("bumps the requested part", async () => {
    expect(await run("1.2.3", "increment", "", "minor")).toContain("1.3.0");
    expect(await run("1.2.3", "increment", "", "major")).toContain("2.0.0");
  });
});
