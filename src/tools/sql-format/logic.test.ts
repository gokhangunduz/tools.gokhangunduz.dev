import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import { formatSql, readParseError, sqlError, suggestDialect } from "./logic";

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

describe("SQL parse errors", () => {
  it("never shows the parser trace, and points at the position", async () => {
    const error = await formatSql(
      "select a from t\nwhere b = (1",
      "postgresql",
      "upper",
      2,
    ).catch((cause) => cause);
    expect(error).toBeInstanceOf(ToolError);
    expect(error.localized.en).not.toMatch(/expecting|→|EOF/);
    expect(error.detail.tr).toBe("SQL parse edilemedi: sorgu yarıda bitiyor");
    expect(error.at?.line).toBe(2);
  });

  it("names the unexpected token and suggests the dialect it looks like", async () => {
    const error = await formatSql(
      "select `name` from users",
      "postgresql",
      "upper",
      2,
    ).catch((cause) => cause);
    expect(error.at).toEqual({ line: 1, column: 8 });
    expect(error.detail.en).toBe(
      'Could not parse the SQL: unexpected "`name`". This looks like MySQL syntax; try switching the dialect',
    );
    expect(error.field).toBe("dialect");
    expect(error.action?.values).toEqual({ dialect: "mysql" });
  });

  it("does not suggest the dialect already chosen", () => {
    const error = sqlError(
      "select `a` from t",
      "mysql",
      'Parse error: Unexpected "`a` from t" at line 1 column 8.',
    );
    expect(error.field).toBeUndefined();
    expect(error.action).toBeUndefined();
    expect(error.detail.tr).toBe('SQL parse edilemedi: beklenmeyen "`a`"');
  });

  it("recognises the common dialect markers", () => {
    expect(suggestDialect("select `a` from t")).toBe("mysql");
    expect(suggestDialect("select top 5 [name] from t")).toBe("tsql");
    expect(suggestDialect("select * from t where id = $1")).toBe("postgresql");
    expect(suggestDialect("select 1")).toBeNull();
  });

  it("reads both error shapes sql-formatter produces", () => {
    expect(
      readParseError('Parse error: Unexpected "[c]" at line 2 column 11.'),
    ).toEqual({ token: "[c]", at: { line: 2, column: 11 } });
    expect(
      readParseError(
        "Parse error at token: «EOF» at line 1 column 17\nUnexpected EOF token",
      ),
    ).toEqual({ token: null, at: { line: 1, column: 17 } });
    expect(
      readParseError(
        'Parse error: Unexpected "`id`, `nam" at line 1 column 8.',
      ),
    ).toEqual({ token: "`id`", at: { line: 1, column: 8 } });
    expect(readParseError("something else")).toEqual({ token: null });
  });
});
