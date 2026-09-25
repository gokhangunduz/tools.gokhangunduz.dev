import { describe, expect, it } from "vitest";
import { render, SUMMARIES } from "./logic";

describe("render", () => {
  it("fills in the year and the holder", () => {
    const text = render("mit", "2026", "G\u00f6khan G\u00fcnd\u00fcz");
    expect(text).toContain("Copyright (c) 2026 G\u00f6khan G\u00fcnd\u00fcz");
    expect(text).not.toContain("{year}");
    expect(text).not.toContain("{holder}");
  });

  it("defaults the year to this one", () => {
    expect(render("mit", "", "X")).toContain(String(new Date().getFullYear()));
  });

  it("requires a holder", () => {
    expect(() => render("mit", "2026", "  ")).toThrow();
  });

  it("points at the canonical text for the licences that must be verbatim", () => {
    expect(render("gpl-3.0", "2026", "X")).toContain(
      "gnu.org/licenses/gpl-3.0.txt",
    );
    expect(render("apache-2.0", "2026", "X")).toContain(
      "apache.org/licenses/LICENSE-2.0.txt",
    );
  });

  it("writes the public-domain dedication without a holder line", () => {
    const text = render("unlicense", "2026", "X");
    expect(text).toContain("public domain");
    expect(text).not.toContain("2026");
  });

  it("has a summary for every licence it offers", () => {
    for (const id of Object.keys(SUMMARIES) as (keyof typeof SUMMARIES)[]) {
      expect(render(id, "2026", "X").length).toBeGreaterThan(200);
    }
  });
});
