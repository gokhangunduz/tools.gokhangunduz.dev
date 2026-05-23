import { describe, expect, it } from "vitest";
import { searchTools, TOOLS } from "./registry";

function ids(query: string, locale: "tr" | "en" = "en") {
  return searchTools(query, locale).map((tool) => tool.id);
}

describe("searchTools", () => {
  it("returns every tool for an empty query", () => {
    expect(ids("  ")).toHaveLength(TOOLS.length);
  });

  it("keeps only tools that match every word", () => {
    const result = ids("json yaml");
    expect(result[0]).toBe("json-yaml");
    expect(result).not.toContain("json-csv");
  });

  it("ignores the connecting words between two formats", () => {
    expect(ids("json to yaml")[0]).toBe("json-yaml");
    expect(ids("json ve yaml", "tr")[0]).toBe("json-yaml");
    expect(ids("json -> csv")[0]).toBe("json-csv");
    expect(ids("json→csv")[0]).toBe("json-csv");
  });

  it("finds nothing when one word matches nothing", () => {
    expect(ids("json qqqq")).toEqual([]);
  });

  it("breaks ties by weight before id", () => {
    expect(ids("json")[0]).toBe("json-viewer");
  });

  it("still ranks an exact name first and is accent-insensitive", () => {
    expect(ids("uuid")[0]).toBe("uuid");
    expect(ids("CRON")[0]).toBe("cron");
  });
});
