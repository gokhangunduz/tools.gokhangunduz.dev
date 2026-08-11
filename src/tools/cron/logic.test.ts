import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import { CronFieldError, explainCron, splitCron } from "./logic";

const NOW = new Date("2026-09-25T10:00:00Z");

describe("explainCron", () => {
  it("explains an expression in Turkish and lists its next runs", async () => {
    const result = await explainCron(
      "0 9 * * 1-5",
      "tr",
      "Europe/Istanbul",
      3,
      "auto",
      NOW,
    );
    expect(result?.sentence).toContain("09:00");
    expect(result?.runs).toHaveLength(3);
    expect(result?.runs[0]).toMatchObject({
      time: "09:00",
      weekday: "Pazartesi",
    });
    expect(result?.runs[0].iso).toBe("2026-09-28T09:00:00.000+03:00");
    expect(result?.text).toContain("Sonraki çalışmalar");
  });

  it("explains it in English too", async () => {
    const result = await explainCron(
      "*/15 * * * *",
      "en",
      "UTC",
      2,
      "auto",
      NOW,
    );
    expect(result?.sentence.toLowerCase()).toContain("15 minutes");
  });

  it("reports an impossible date on the runs, keeping the sentence", async () => {
    const result = await explainCron("0 0 31 2 *", "en", "UTC", 3, "auto", NOW);
    expect(result?.sentence).toBeTruthy();
    expect(result?.runs).toHaveLength(0);
    expect(result?.runsError?.localized.en).toMatch(/never fires/);
  });

  it("supports the six-field form with seconds", async () => {
    const result = await explainCron(
      "30 0 9 * * *",
      "en",
      "UTC",
      1,
      "auto",
      NOW,
    );
    expect(result?.split.syntax).toBe("seconds");
    expect(result?.runs[0].time).toBe("09:00:30");
  });

  it("detects Quartz and numbers the week from 1 = Sunday", async () => {
    const result = await explainCron(
      "0 0 12 ? * 2",
      "en",
      "UTC",
      2,
      "auto",
      NOW,
    );
    expect(result?.split.syntax).toBe("quartz");
    expect(result?.warnings[0].message.en).toMatch(/Quartz/);
    expect(result?.sentence).toContain("Monday");
    expect(result?.runs.map((run) => run.weekday)).toEqual([
      "Monday",
      "Monday",
    ]);
  });

  it("filters a Quartz year field", async () => {
    const result = await explainCron(
      "0 0 12 1 1 ? 2028",
      "en",
      "UTC",
      3,
      "auto",
      NOW,
    );
    expect(result?.runs).toHaveLength(1);
    expect(result?.runs[0].iso).toBe("2028-01-01T12:00:00.000Z");
  });

  it("expands macros", async () => {
    const result = await explainCron("@hourly", "en", "UTC", 1, "auto", NOW);
    expect(result?.split.tokens).toEqual(["0", "*", "*", "*", "*"]);
    expect(result?.runs[0].iso).toBe("2026-09-25T11:00:00.000Z");
  });

  it("warns that day of month and day of week combine with OR", async () => {
    const result = await explainCron("0 0 13 * 5", "tr", "UTC", 1, "auto", NOW);
    expect(
      result?.warnings.some(
        (w) => w.kind === "or" && w.message.tr.includes("VEYA"),
      ),
    ).toBe(true);
  });

  it("keeps the sentence and drops only the runs for a bad zone", async () => {
    const result = await explainCron(
      "0 9 * * *",
      "en",
      "Mars/Base",
      3,
      "auto",
      NOW,
    );
    expect(result?.sentence).toBeTruthy();
    expect(result?.runs).toHaveLength(0);
    expect(result?.runsError?.field).toBe("timeZone");
  });

  it("rejects an expression with too few fields", async () => {
    await expect(explainCron("0 9", "en", "UTC", 3)).rejects.toThrow(
      /At least 5 fields/,
    );
  });

  it("names the field that is out of range", async () => {
    try {
      await explainCron("0 99 * * *", "tr", "UTC", 3);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(CronFieldError);
      expect((error as CronFieldError).index).toBe(1);
      expect((error as ToolError).localized.tr).toBe(
        "2. alan (saat) 0–23 arasında olmalı, 99 verildi.",
      );
    }
  });

  it("never passes library text through", async () => {
    await expect(
      explainCron("0 0 * * mon-xyz", "en", "UTC", 3),
    ).rejects.toThrow(/Field 5 \(day of week\) is not understood/);
  });

  it("insists on the field count of an explicit syntax", () => {
    expect(() => splitCron("0 9 * * *", "seconds")).toThrow(/6 fields/);
  });

  it("returns null for blank input", async () => {
    expect(await explainCron("  ", "tr", "UTC", 3)).toBeNull();
  });
});
