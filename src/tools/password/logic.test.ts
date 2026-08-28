import { describe, expect, it } from "vitest";
import {
  buildAlphabet,
  crackTime,
  entropyBits,
  generatePasswords,
  SETS,
  strength,
} from "./logic";

const base = {
  length: 16,
  count: 1,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  avoidAmbiguous: false,
};

describe("generatePasswords", () => {
  it("produces passwords of the requested length and count", () => {
    const lines = generatePasswords({ ...base, length: 20, count: 5 }).split(
      "\n",
    );
    expect(lines).toHaveLength(5);
    for (const line of lines) expect(line).toHaveLength(20);
  });

  it("uses only the selected sets", () => {
    const value = generatePasswords({
      ...base,
      upper: false,
      symbols: false,
      length: 200,
    });
    expect(value).toMatch(/^[a-z0-9]+$/);
  });

  it("excludes ambiguous characters when asked", () => {
    const value = generatePasswords({
      ...base,
      avoidAmbiguous: true,
      length: 200,
    });
    expect(value).not.toMatch(/[Il1O0]/);
  });

  it("does not repeat itself", () => {
    const lines = generatePasswords({ ...base, count: 50 }).split("\n");
    expect(new Set(lines).size).toBe(50);
  });

  it("is not biased towards the start of the alphabet", () => {
    // 8000 characters from a 26-letter alphabet: a modulo bias would show up
    // as the first six letters appearing markedly more often.
    const value = generatePasswords({
      ...base,
      upper: false,
      digits: false,
      symbols: false,
      length: 250,
      count: 32,
    }).replace(/\n/g, "");
    const counts = new Map<string, number>();
    for (const character of value) {
      counts.set(character, (counts.get(character) ?? 0) + 1);
    }
    const expected = value.length / 26;
    for (const count of counts.values()) {
      expect(Math.abs(count - expected) / expected).toBeLessThan(0.25);
    }
  });

  it("puts every enabled set into every password", () => {
    const lines = generatePasswords({ ...base, length: 8, count: 1000 }).split(
      "\n",
    );
    const symbol = new RegExp(`[${SETS.symbols.replace(/[\]\\^-]/g, "\\$&")}]`);
    for (const line of lines) {
      expect(line).toMatch(/[a-z]/);
      expect(line).toMatch(/[A-Z]/);
      expect(line).toMatch(/[0-9]/);
      expect(line).toMatch(symbol);
    }
  });

  it("uses a custom symbol set, and only its characters", () => {
    const value = generatePasswords({
      ...base,
      lower: false,
      upper: false,
      digits: false,
      symbolSet: "-_.~",
      length: 200,
    });
    expect(value).toMatch(/^[-_.~]+$/);
  });

  it("can leave out lowercase letters", () => {
    expect(
      generatePasswords({ ...base, lower: false, length: 200 }),
    ).not.toMatch(/[a-z]/);
  });

  it("refuses a length shorter than the number of sets", () => {
    expect(() => generatePasswords({ ...base, length: 3 })).toThrow();
  });

  it("refuses an empty alphabet or a silly length", () => {
    expect(() =>
      generatePasswords({
        ...base,
        lower: false,
        upper: false,
        digits: false,
        symbols: false,
      }),
    ).toThrow();
    expect(() => generatePasswords({ ...base, length: 2 })).toThrow();
    expect(() => generatePasswords({ ...base, length: 300 })).toThrow();
    expect(() => generatePasswords({ ...base, length: NaN })).toThrow();
  });
});

describe("entropyBits", () => {
  it("drops when the alphabet shrinks", () => {
    const full = entropyBits(base);
    const smaller = entropyBits({ ...base, symbols: false });
    expect(full).toBeGreaterThan(smaller);
  });

  it("drops when ambiguous characters are excluded", () => {
    expect(entropyBits({ ...base, avoidAmbiguous: true })).toBeLessThan(
      entropyBits(base),
    );
  });

  it("matches the textbook figure for a 26-letter alphabet", () => {
    expect(
      entropyBits({
        ...base,
        length: 10,
        upper: false,
        digits: false,
        symbols: false,
      }),
    ).toBe(47);
  });
});

describe("buildAlphabet", () => {
  it("is empty when nothing is selected", () => {
    expect(
      buildAlphabet({
        ...base,
        lower: false,
        upper: false,
        digits: false,
        symbols: false,
      }),
    ).toBe("");
  });
});

describe("crackTime", () => {
  it("grows with the entropy", () => {
    expect(crackTime(40, "en")).toContain("seconds");
    expect(crackTime(60, "en")).toContain("days");
    expect(crackTime(128, "en")).toBe("longer than the age of the universe");
    expect(crackTime(128, "tr")).toBe("evrenin yaşından uzun");
  });

  it("marks a figure as approximate and writes it for the locale", () => {
    expect(crackTime(40, "en")).toBe("~5.5 seconds");
    expect(crackTime(40, "tr")).toBe("~5,5 saniye");
    expect(crackTime(60, "en")).toBe("~67 days");
  });

  it("stays qualitative past a million years", () => {
    expect(crackTime(85, "en")).toBe("millions of years");
    expect(crackTime(94, "en")).toBe("billions of years");
  });
});

describe("strength", () => {
  it("rates by entropy", () => {
    expect(strength(40).text.en).toBe("Weak");
    expect(strength(40).tone).toBe("destructive");
    expect(strength(70).text.tr).toBe("Orta");
    expect(strength(100).text.en).toBe("Strong");
    expect(strength(130).text.tr).toBe("Çok güçlü");
  });
});
