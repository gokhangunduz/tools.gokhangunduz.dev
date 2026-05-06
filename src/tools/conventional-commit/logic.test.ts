import { describe, expect, it } from "vitest";
import { build, review } from "./logic";

const base = {
  type: "feat" as const,
  scope: "",
  subject: "add the export button",
  body: "",
  breaking: "",
  issue: "",
};

describe("build", () => {
  it("writes the header", () => {
    expect(build(base)).toBe("feat: add the export button");
  });

  it("includes the scope", () => {
    expect(build({ ...base, scope: "reports" })).toBe(
      "feat(reports): add the export button",
    );
  });

  it("marks a breaking change in both places tools and people read", () => {
    const message = build({ ...base, breaking: "the export format changed" });
    expect(message).toContain("feat!:");
    expect(message).toContain("BREAKING CHANGE: the export format changed");
  });

  it("turns issue numbers into footers", () => {
    const message = build({ ...base, issue: "#12, 34" });
    expect(message).toContain("Closes #12");
    expect(message).toContain("Closes #34");
  });

  it("separates body and footers with blank lines", () => {
    const message = build({
      ...base,
      body: "Why this was needed.",
      issue: "7",
    });
    const lines = message.split("\n");
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe("Why this was needed.");
    expect(lines[3]).toBe("");
  });

  it("drops a trailing full stop rather than complaining about it", () => {
    expect(build({ ...base, subject: "add the button." })).toBe(
      "feat: add the button",
    );
  });

  it("refuses a header over 72 characters", () => {
    expect(() => build({ ...base, subject: "x".repeat(80) })).toThrow(/72/);
  });

  it("refuses an empty subject", () => {
    expect(() => build({ ...base, subject: "  " })).toThrow();
  });
});

describe("review", () => {
  it("notices a capitalised subject", () => {
    expect(review({ ...base, subject: "Add the button" }, "en")).toContain(
      "lowercase",
    );
  });

  it("notices a past-tense verb", () => {
    expect(review({ ...base, subject: "added the button" }, "en")).toContain(
      "imperative",
    );
  });

  it("says nothing when the subject is fine", () => {
    expect(review(base, "en")).toBeNull();
  });
});
