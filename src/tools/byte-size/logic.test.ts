import { describe, expect, it } from "vitest";
import { describeSize, parseSize } from "./logic";

describe("parseSize", () => {
  it("reads both conventions", () => {
    expect(parseSize("1 MB")).toBe(1e6);
    expect(parseSize("1 MiB")).toBe(1024 * 1024);
  });

  it("reads a bare number as bytes", () => {
    expect(parseSize("1536")).toBe(1536);
  });

  it("reads bits", () => {
    expect(parseSize("8 bits")).toBe(1);
  });

  it("rejects an unknown unit", () => {
    expect(() => parseSize("5 parsecs")).toThrow(/Unknown unit/);
  });
});

describe("describeSize", () => {
  it("shows the gap between a 1 TB disk and 931 GiB", () => {
    const output = describeSize("1 TB");
    expect(output).toContain("1.00 TB");
    expect(output).toContain("931 GiB");
  });

  it("prints transfer times", () => {
    const output = describeSize("1 GB");
    expect(output).toContain("@ 100 Mbit/s");
    expect(output).toContain("1 m 20 s");
  });

  it("keeps small sizes in bytes", () => {
    expect(describeSize("512")).toContain("512 B");
  });
});
