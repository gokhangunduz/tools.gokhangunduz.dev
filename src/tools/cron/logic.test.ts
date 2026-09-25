import { describe, expect, it } from "vitest";
import { explainCron } from "./logic";

describe("explainCron", () => {
  it("explains an expression in Turkish and lists its next runs", async () => {
    const output = await explainCron("0 9 * * 1-5", "tr", "Europe/Istanbul", 3);
    expect(output).toContain("09:00");
    expect(output).toContain("Sonraki çalışmalar");
    expect(
      output.split("\n").filter((line) => line.startsWith("  ")),
    ).toHaveLength(3);
  });

  it("explains it in English too", async () => {
    const output = await explainCron("*/15 * * * *", "en", "UTC", 2);
    expect(output.toLowerCase()).toContain("15 minutes");
  });

  it("rejects an impossible date rather than printing a schedule that never fires", async () => {
    // 31 February parses as syntax and can never occur; cron-parser refuses it
    // outright, which is the answer the user needs either way.
    await expect(explainCron("0 0 31 2 *", "en", "UTC", 3)).rejects.toThrow();
  });

  it("supports the six-field form with seconds", async () => {
    const output = await explainCron("30 0 9 * * *", "en", "UTC", 1);
    expect(output).toContain("09:00:30");
  });

  it("rejects an expression with too few fields", async () => {
    await expect(explainCron("0 9", "en", "UTC", 3)).rejects.toThrow();
  });

  it("rejects an out-of-range value", async () => {
    await expect(explainCron("0 99 * * *", "en", "UTC", 3)).rejects.toThrow();
  });

  it("returns empty for blank input", async () => {
    expect(await explainCron("  ", "tr", "UTC", 3)).toBe("");
  });
});
