import { describe, expect, it } from "vitest";
import { build } from "./logic";

const base = {
  repo: "gokhangunduz/tools",
  style: "flat" as const,
  format: "markdown" as const,
  extra: "",
};

describe("build", () => {
  it("writes Markdown badges that link somewhere useful", () => {
    const output = build(base);
    expect(output).toContain(
      "[![CI](https://img.shields.io/github/actions/workflow/status/gokhangunduz/tools/ci.yml?style=flat)]",
    );
    expect(output).toContain("(https://github.com/gokhangunduz/tools/actions)");
  });

  it("accepts a pasted GitHub URL", () => {
    expect(
      build({ ...base, repo: "https://github.com/gokhangunduz/tools/" }),
    ).toContain("gokhangunduz/tools");
  });

  it("can write HTML instead", () => {
    const output = build({ ...base, format: "html" });
    expect(output).toContain("<a href=");
    expect(output).toContain("<img src=");
  });

  it("escapes a custom badge the way shields.io requires", () => {
    const output = build({ ...base, extra: "built with-love:next-js:black" });
    // A hyphen is doubled and a space becomes an underscore.
    expect(output).toContain("built_with--love-next--js-black");
  });

  it("refuses something that is not owner/name", () => {
    expect(() => build({ ...base, repo: "just-a-name" })).toThrow();
  });
});
