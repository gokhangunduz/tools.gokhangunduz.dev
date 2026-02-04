import { describe, expect, it } from "vitest";
import { formatSql } from "./logic";

describe("formatSql", () => {
  it("breaks a query onto its clauses", async () => {
    const output = await formatSql(
      "select a,b from t where a=1 order by b",
      "sql",
      "upper",
      2,
    );
    expect(output).toContain("SELECT");
    expect(output).toContain("FROM");
    expect(output.split("\n").length).toBeGreaterThan(3);
  });

  it("can leave keyword case alone", async () => {
    const output = await formatSql("select 1", "sql", "preserve", 2);
    expect(output).toContain("select");
  });

  it("knows dialect-specific keywords", async () => {
    const output = await formatSql(
      "insert into t (a) values (1) returning id",
      "postgresql",
      "upper",
      2,
    );
    expect(output).toContain("RETURNING");
  });

  it("returns empty for blank input", async () => {
    expect(await formatSql("  ", "sql", "upper", 2)).toBe("");
  });
});
