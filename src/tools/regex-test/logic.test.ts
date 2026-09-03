import { describe, expect, it } from "vitest";
import {
  captureNames,
  columnText,
  describeSyntaxError,
  runRegex,
  type RegexRequest,
} from "./logic";

const TEXT = "Ali: 0532 111 22 33\nAyşe: 0545 444 55 66";

function run(request: Partial<RegexRequest>) {
  const outcome = runRegex({
    input: TEXT,
    pattern: "\\d{4}",
    flags: "g",
    mode: "matches",
    replacement: "",
    ...request,
  });
  if (!outcome.ok) throw new Error(outcome.error.en);
  return outcome;
}

describe("runRegex", () => {
  it("lists matches with line and column", () => {
    const { matches, count } = run({});
    expect(count).toBe(2);
    expect(matches[0]).toMatchObject({
      text: "0532",
      index: 5,
      line: 1,
      column: 6,
    });
    expect(matches[1]).toMatchObject({ text: "0545", line: 2, column: 7 });
  });

  it("lists numbered and named groups with their ranges", () => {
    const { matches, groupNames } = run({
      input: "2026-09-25",
      pattern: "(?<year>\\d{4})-(\\d{2})",
    });
    expect(groupNames).toEqual(["year", null]);
    expect(matches[0].groups).toEqual(["2026", "09"]);
    expect(matches[0].ranges).toEqual([
      [0, 4],
      [5, 7],
    ]);
  });

  it("lists every match even without the g flag", () => {
    expect(run({ flags: "" }).count).toBe(2);
  });

  it("replaces with exactly the flags chosen", () => {
    const input = "2026-09-25 2027-01-02";
    const pattern = "(?<y>\\d{4})-(\\d{2})-(\\d{2})";
    expect(
      run({ input, pattern, mode: "replace", replacement: "$3.$2.$<y>" })
        .replaced,
    ).toBe("25.09.2026 02.01.2027");
    expect(
      run({
        input,
        pattern,
        flags: "",
        mode: "replace",
        replacement: "$3.$2.$1",
      }).replaced,
    ).toBe("25.09.2026 2027-01-02");
  });

  it("does not hang on a zero-length match", () => {
    expect(run({ input: "abc", pattern: "x*" }).count).toBe(4);
  });

  it("splits on the pattern", () => {
    expect(
      run({ input: "a, b,c", pattern: "\\s*,\\s*", mode: "split" }).parts,
    ).toEqual(["a", "b", "c"]);
  });

  it("honours the case-insensitive flag", () => {
    expect(run({ input: "AbaB", pattern: "b", flags: "gi" }).count).toBe(2);
    expect(run({ input: "AbaB", pattern: "b", flags: "g" }).count).toBe(1);
  });

  it("reports an invalid pattern in both languages, without the engine's text", () => {
    const outcome = runRegex({
      input: "x",
      pattern: "(unclosed",
      flags: "g",
      mode: "matches",
      replacement: "",
    });
    expect(outcome).toEqual({
      ok: false,
      error: {
        tr: 'Desen geçersiz: bir "(" kapanmamış.',
        en: 'Invalid pattern: a "(" is never closed.',
      },
    });
  });

  it("asks for a pattern when there is none", () => {
    expect(
      runRegex({
        input: "x",
        pattern: "",
        flags: "",
        mode: "matches",
        replacement: "",
      }).ok,
    ).toBe(false);
  });

  it("copies one column", () => {
    const { matches } = run({ input: "a1 b2", pattern: "([a-z])(\\d)" });
    expect(columnText(matches, 0)).toBe("a1\nb2");
    expect(columnText(matches, 2)).toBe("1\n2");
  });
});

describe("describeSyntaxError", () => {
  it("maps known causes and falls back to the pattern", () => {
    expect(
      describeSyntaxError(
        "Invalid regular expression: /*/: Nothing to repeat",
        "*",
      ).en,
    ).toBe("Invalid pattern: a *, + or ? has nothing to repeat.");
    expect(describeSyntaxError("something odd", "a(b").tr).toBe(
      "Desen geçersiz: /a(b/",
    );
  });
});

describe("captureNames", () => {
  it("skips non-capturing groups, lookarounds and classes", () => {
    expect(captureNames("(?:a)(?<n>b)(?=c)(?<!d)[(](e)\\(")).toEqual([
      "n",
      null,
    ]);
  });
});
