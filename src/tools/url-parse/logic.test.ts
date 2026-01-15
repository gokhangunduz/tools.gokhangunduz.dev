import { describe, expect, it } from "vitest";
import { parseUrl } from "./logic";

describe("parseUrl", () => {
  it("lists the parts and the query", () => {
    const output = parseUrl("https://x.dev:8443/a/b?q=bir%20iki&r=2#top");
    expect(output).toContain("host");
    expect(output).toContain("x.dev");
    expect(output).toContain("8443");
    expect(output).toContain("/a/b");
    expect(output).toContain("top");
    // The point of the tool: the value is readable, not percent-encoded.
    expect(output).toContain("bir iki");
    expect(output).toContain("query (2)");
  });

  it("keeps a password out of the output", () => {
    const output = parseUrl("https://user:hunter2@x.dev/");
    expect(output).toContain("user");
    expect(output).not.toContain("hunter2");
  });

  it("rejects a bare hostname, where the scheme is missing", () => {
    expect(() => parseUrl("x.dev/a")).toThrow();
  });

  it("returns nothing for empty input", () => {
    expect(parseUrl("   ")).toBe("");
  });
});
