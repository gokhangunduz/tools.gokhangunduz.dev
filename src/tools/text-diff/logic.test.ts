import { describe, expect, it } from "vitest";
import {
  collapse,
  diffText,
  formatDiff,
  isIdentical,
  toPatch,
  type DiffOptions,
  type Row,
} from "./logic";

const line: DiffOptions = {
  granularity: "line",
  ignoreCase: false,
  ignoreWhitespace: false,
};

const text = async (left: string, right: string, options = line) =>
  formatDiff(await diffText(left, right, options));

describe("diffText", () => {
  it("marks added and removed lines", async () => {
    const output = await text("a\nb\nc", "a\nx\nc");
    expect(output).toContain("- b");
    expect(output).toContain("+ x");
    expect(output).toContain("  a");
  });

  it("does not report every line as changed when one is inserted at the top", async () => {
    const output = await text("a\nb", "new\na\nb");
    const changed = output.split("\n").filter((row) => row.startsWith("+"));
    expect(changed).toHaveLength(1);
  });

  it("does not report the last line when only one side ends in a newline", async () => {
    const diff = await diffText("a\nb", "a\nb\nc", line);
    expect(formatDiff(diff)).toBe("  a\n  b\n+ c");
    expect(isIdentical(await diffText("a\nb\n", "a\nb", line))).toBe(true);
  });

  it("ignores a CRLF/LF difference", async () => {
    expect(isIdentical(await diffText("a\r\nb", "a\nb", line))).toBe(true);
  });

  it("numbers the rows on both sides", async () => {
    const diff = await diffText("a\nb\nc", "a\nx\ny\nc", line);
    if (diff.mode !== "line") throw new Error("line mode");
    expect(
      diff.rows.map((row) => [row.type, row.oldNo, row.newNo, row.text]),
    ).toEqual([
      ["same", 1, 1, "a"],
      ["removed", 2, undefined, "b"],
      ["added", undefined, 2, "x"],
      ["added", undefined, 3, "y"],
      ["same", 3, 4, "c"],
    ]);
    expect(diff.added).toBe(2);
    expect(diff.removed).toBe(1);
  });

  it("marks the changed words inside a replaced line", async () => {
    const diff = await diffText(
      "the quick brown fox",
      "the quick red fox",
      line,
    );
    if (diff.mode !== "line") throw new Error("line mode");
    const removed = diff.rows.find((row) => row.type === "removed");
    const added = diff.rows.find((row) => row.type === "added");
    expect(removed?.inline).toContainEqual({ type: "removed", text: "brown" });
    expect(added?.inline).toContainEqual({ type: "added", text: "red" });
  });

  it("can compare word by word, inline", async () => {
    const output = await text("bir iki üç", "bir dört üç", {
      ...line,
      granularity: "word",
    });
    expect(output).toContain("[-iki-]");
    expect(output).toContain("{+dört+}");
  });

  it("can ignore case and surrounding whitespace", async () => {
    expect(
      isIdentical(
        await diffText("Merhaba", "merhaba", { ...line, ignoreCase: true }),
      ),
    ).toBe(true);
    expect(
      isIdentical(
        await diffText("  a\nb", "a\nb  ", { ...line, ignoreWhitespace: true }),
      ),
    ).toBe(true);
  });

  it("returns nothing when both sides are empty", async () => {
    expect(await text("", "")).toBe("");
  });
});

describe("collapse", () => {
  const same = (n: number): Row[] =>
    Array.from({ length: n }, (_, i) => ({
      type: "same",
      oldNo: i + 1,
      newNo: i + 1,
      text: String(i),
    }));

  it("folds a long unchanged run down to its context", () => {
    const rows: Row[] = [
      ...same(10),
      { type: "added", newNo: 11, text: "x" },
      ...same(10),
    ];
    const blocks = collapse(rows, 3);
    expect(blocks[0]).toEqual({ type: "skip", count: 7 });
    expect(blocks.at(-1)).toEqual({ type: "skip", count: 7 });
    expect(blocks).toHaveLength(9);
  });

  it("folds every unchanged line when there is no context", () => {
    const rows: Row[] = [
      ...same(1),
      { type: "removed", oldNo: 2, text: "x" },
      { type: "same", oldNo: 3, newNo: 2, text: "y" },
      { type: "added", newNo: 3, text: "z" },
    ];
    const blocks = collapse(rows, 0);
    expect(blocks.map((block) => block.type)).toEqual([
      "skip",
      "removed",
      "skip",
      "added",
    ]);
  });

  it("leaves an unchanged text alone", () => {
    expect(collapse(same(10), 3)).toHaveLength(10);
  });
});

describe("toPatch", () => {
  it("writes a unified patch", async () => {
    const patch = await toPatch("a\nb\n", "a\nc\n", false);
    expect(patch).toContain("--- a");
    expect(patch).toContain("+++ b");
    expect(patch).toContain("-b");
    expect(patch).toContain("+c");
  });
});
