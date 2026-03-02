import { describe, expect, it } from "vitest";
import { countChanges, diffText } from "./logic";

describe("diffText", () => {
  it("marks added and removed lines", async () => {
    const output = await diffText("a\nb\nc", "a\nx\nc", "line", false);
    expect(output).toContain("- b");
    expect(output).toContain("+ x");
    expect(output).toContain("  a");
  });

  it("does not report every line as changed when one is inserted at the top", async () => {
    const output = await diffText("a\nb", "new\na\nb", "line", false);
    const changed = output.split("\n").filter((line) => line.startsWith("+"));
    expect(changed).toHaveLength(1);
  });

  it("ignores a CRLF/LF difference", async () => {
    const output = await diffText("a\r\nb", "a\nb", "line", false);
    expect(output).not.toContain("+");
    expect(output).not.toContain("-");
  });

  it("can compare word by word, inline", async () => {
    const output = await diffText("bir iki üç", "bir dört üç", "word", false);
    expect(output).toContain("[-iki-]");
    expect(output).toContain("{+dört+}");
  });

  it("can ignore case", async () => {
    expect(await diffText("Merhaba", "merhaba", "line", true)).not.toContain(
      "+",
    );
  });

  it("returns empty when both sides are empty", async () => {
    expect(await diffText("", "", "line", false)).toBe("");
  });
});

describe("countChanges", () => {
  it("counts lines on each side", async () => {
    const counts = await countChanges("a\nb\nc", "a\nx\ny\nc", "line", false);
    expect(counts.removed).toBe(1);
    expect(counts.added).toBe(2);
  });
});
