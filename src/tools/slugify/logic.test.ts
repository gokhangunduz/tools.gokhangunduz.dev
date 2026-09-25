import { describe, expect, it } from "vitest";
import { slugify } from "./logic";

const base = { separator: "-", lower: true, strict: true };

describe("slugify", () => {
  it("transliterates Turkish letters instead of dropping them", () => {
    // The failure this exists to prevent: "Işık" becoming "ik".
    expect(slugify("Işık Hızı", base)).toBe("isik-hizi");
    expect(slugify("Çağrı Şükrü Öğüt", base)).toBe("cagri-sukru-ogut");
  });

  it("handles accents from other languages", () => {
    expect(slugify("Café señor", base)).toBe("cafe-senor");
  });

  it("collapses and trims separators", () => {
    expect(slugify("  bir --- iki  ", base)).toBe("bir-iki");
  });

  it("can use another separator", () => {
    expect(slugify("bir iki", { ...base, separator: "_" })).toBe("bir_iki");
  });

  it("can keep the case", () => {
    expect(slugify("Bir İki", { ...base, lower: false })).toBe("Bir-Iki");
  });

  it("keeps URL-safe punctuation when not strict", () => {
    expect(slugify("v1.2_final~x", { ...base, strict: false })).toBe(
      "v1.2_final~x",
    );
    expect(slugify("v1.2_final~x", base)).toBe("v1-2-final-x");
  });

  it("returns empty for blank input", () => {
    expect(slugify("   ", base)).toBe("");
  });
});
