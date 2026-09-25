import { describe, expect, it } from "vitest";
import { validate } from "./logic";

describe("validate", () => {
  it("accepts each format", async () => {
    expect(await validate('{"a":1}', "json", "en")).toContain("✓");
    expect(await validate("a: 1", "yaml", "en")).toContain("✓");
    expect(await validate('a = "1"', "toml", "en")).toContain("✓");
    expect(await validate("<a>1</a>", "xml", "en")).toContain("✓");
    expect(await validate("a,b\n1,2", "csv", "en")).toContain("✓");
  });

  it("rejects each format with a reason", async () => {
    expect(await validate("{nope}", "json", "en")).toContain("✗");
    expect(await validate("a: 1\n  b: 2", "yaml", "en")).toContain("✗");
    expect(await validate("a = = 1", "toml", "en")).toContain("✗");
    expect(await validate("<a><b></a>", "xml", "en")).toContain("✗");
  });

  it("names the line for XML", async () => {
    expect(await validate("<a>\n<b>\n</a>", "xml", "en")).toMatch(/line \d+/);
  });

  it("accepts a multi-document YAML file", async () => {
    expect(await validate("a: 1\n---\nb: 2", "yaml", "en")).toContain("✓");
  });

  it("returns empty for blank input", async () => {
    expect(await validate("  ", "json", "tr")).toBe("");
  });
});
