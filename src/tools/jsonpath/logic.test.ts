import { describe, expect, it } from "vitest";
import { query } from "./logic";

const DOCUMENT = JSON.stringify({
  store: {
    books: [
      { title: "Bir", price: 30, tags: ["a"] },
      { title: "İki", price: 50, tags: ["b", "c"] },
      { title: "Üç", price: 120 },
    ],
  },
});

describe("query", () => {
  it("selects a field across an array", async () => {
    expect(await query(DOCUMENT, "$.store.books[*].title", 0)).toBe(
      '["Bir","İki","Üç"]',
    );
  });

  it("filters", async () => {
    const output = await query(
      DOCUMENT,
      "$.store.books[?(@.price > 40)].title",
      0,
    );
    expect(output).toBe('["İki","Üç"]');
  });

  it("finds a key at any depth", async () => {
    expect(await query(DOCUMENT, "$..tags[*]", 0)).toBe('["a","b","c"]');
  });

  it("says plainly when nothing matches", async () => {
    expect(await query(DOCUMENT, "$.nothing", 0)).toContain("No match");
  });

  it("reports invalid JSON and a broken filter separately", async () => {
    await expect(query("{nope}", "$", 0)).rejects.toThrow(/Invalid JSON/);
    // jsonpath-plus is forgiving about brackets but not about a filter it
    // cannot compile, which is where a typo actually lands.
    await expect(
      query(DOCUMENT, "$.store.books[?(@.price > )]", 0),
    ).rejects.toThrow(/Invalid query/);
  });

  it("asks for a query when there is none", async () => {
    await expect(query(DOCUMENT, "  ", 0)).rejects.toThrow();
  });
});
