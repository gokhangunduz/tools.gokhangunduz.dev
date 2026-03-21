import { describe, expect, it } from "vitest";
import { decodeBase32, hotp, secondsRemaining, totp } from "./logic";

// RFC 4226's test secret, "12345678901234567890" in base32.
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const options = { digits: 6, period: 30, algorithm: "SHA-1" as const };

describe("decodeBase32", () => {
  it("decodes the RFC's secret to its twenty bytes", () => {
    expect([...decodeBase32(RFC_SECRET)]).toEqual([
      ...new TextEncoder().encode("12345678901234567890"),
    ]);
  });

  it("ignores the spaces and dashes providers print", () => {
    expect(decodeBase32("GEZD GNBV-GY3T")).toEqual(
      decodeBase32("GEZDGNBVGY3T"),
    );
  });

  it("rejects a character outside the alphabet", () => {
    expect(() => decodeBase32("GEZD1")).toThrow();
    expect(() => decodeBase32("  ")).toThrow();
  });
});

describe("hotp", () => {
  it("matches the RFC 4226 test vectors", async () => {
    const expected = [
      "755224",
      "287082",
      "359152",
      "969429",
      "338314",
      "254676",
      "287922",
      "162583",
      "399871",
      "520489",
    ];
    for (const [counter, code] of expected.entries()) {
      expect(await hotp(RFC_SECRET, counter, options)).toBe(code);
    }
  });
});

describe("totp", () => {
  it("matches the RFC 6238 vector for SHA-1", async () => {
    // T = 59 seconds after the epoch.
    expect(await totp(RFC_SECRET, { ...options, digits: 8 }, 59_000)).toBe(
      "94287082",
    );
  });

  it("gives the same code throughout one period", async () => {
    const a = await totp(RFC_SECRET, options, 1_000_000_000);
    // 1e9 ms is ten seconds into a period, so twenty seconds still fit in it.
    const b = await totp(RFC_SECRET, options, 1_000_000_000 + 15_000);
    expect(a).toBe(b);
  });

  it("changes at the period boundary", async () => {
    const a = await totp(RFC_SECRET, options, 1_000_000_000);
    const b = await totp(RFC_SECRET, options, 1_000_000_000 + 31_000);
    expect(a).not.toBe(b);
  });
});

describe("secondsRemaining", () => {
  it("counts down within the period", () => {
    expect(secondsRemaining(30, 1_000_000_000)).toBe(20);
  });
});
