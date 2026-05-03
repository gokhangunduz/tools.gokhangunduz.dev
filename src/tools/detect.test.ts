import { describe, expect, it } from "vitest";
import { detect } from "./detect";

function id(value: string) {
  return detect(value)?.toolId ?? null;
}

describe("detect", () => {
  it("recognises a JWT before treating it as base64", () => {
    expect(
      id(
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      ),
    ).toBe("jwt-decode");
  });

  it("recognises a UUID, a hash and a bcrypt hash", () => {
    expect(id("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe("uuid");
    expect(id("900150983cd24fb0d6963f7d28e17f72")).toBe("hash-text");
    expect(id("$2b$10$" + "x".repeat(53))).toBe("bcrypt");
  });

  it("recognises timestamps in both forms", () => {
    expect(id("1700000000")).toBe("timestamp");
    expect(id("2026-09-25T12:00:00Z")).toBe("timestamp");
  });

  it("recognises an address, a URL and JSON", () => {
    expect(id("192.168.1.0/24")).toBe("cidr");
    expect(id("https://x.dev/a?b=1")).toBe("url-parse");
    expect(id('{"a":[1,2,3]}')).toBe("json-viewer");
  });

  it("recognises markup", () => {
    expect(id('<svg viewBox="0 0 1 1"></svg>')).toBe("svg-optimize");
    expect(id('<div class="a">x</div>')).toBe("html-jsx");
  });

  it("recognises base64 and hex as the fallbacks they are", () => {
    expect(id("TWVyaGFiYSBkw7xueWE=")).toBe("base64-text");
    expect(id("4d65726861626120")).toBe("hex-text");
  });

  it("says nothing about a search term", () => {
    expect(id("base64 kodla")).toBeNull();
    expect(id("timestamp")).toBeNull();
    expect(id("hash")).toBeNull();
  });

  it("says nothing about something too short to judge", () => {
    expect(id("abc")).toBeNull();
    expect(id("1700")).toBeNull();
  });
});
