import { describe, expect, it } from "vitest";
import { countTokens, report } from "./logic";

describe("countTokens", () => {
  it("counts a short English phrase", async () => {
    expect(await countTokens("Hello world", "o200k_base")).toBe(2);
  });

  it("shows that Turkish costs more tokens than English", async () => {
    const english = await countTokens("the change is small", "o200k_base");
    const turkish = await countTokens("değişiklik küçüktür", "o200k_base");
    expect(turkish).toBeGreaterThan(english);
  });

  it("differs between the two encodings", async () => {
    // Turkish is where the two encodings diverge: o200k has more of it.
    const text = "değişiklik küçüktür ama önemli";
    const [a, b] = await Promise.all([
      countTokens(text, "o200k_base"),
      countTokens(text, "cl100k_base"),
    ]);
    expect(a).not.toBe(b);
  });

  it("is zero for empty input", async () => {
    expect(await countTokens("", "o200k_base")).toBe(0);
  });
});

describe("report", () => {
  it("prints the ratios that explain a bill", async () => {
    const output = await report("bir iki üç dört", "o200k_base", "tr");
    expect(output).toMatch(/token\s+\d+/);
    expect(output).toContain("token/kelime");
  });

  it("says plainly that the Claude figure is an estimate", async () => {
    expect(await report("x", "o200k_base", "en")).toContain("not identical");
  });
});
