import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import { decodeUrl, encodeUrl, looksEncoded, toScope } from "./logic";

describe("encodeUrl", () => {
  it("escapes the characters that would change a URL's structure", () => {
    expect(encodeUrl("a&b=c/d?e", "value")).toBe("a%26b%3Dc%2Fd%3Fe");
  });

  it("leaves that structure alone when encoding a whole URL", () => {
    expect(encodeUrl("https://x.dev/a b?q=1&r=2", "url")).toBe(
      "https://x.dev/a%20b?q=1&r=2",
    );
  });

  it("encodes non-ASCII as UTF-8 bytes", () => {
    expect(encodeUrl("ç", "value")).toBe("%C3%A7");
  });

  it("writes a space as + in form scope", () => {
    expect(encodeUrl("a b&c", "form")).toBe("a+b%26c");
  });

  it("reports a lone surrogate as a ToolError", () => {
    expect(() => encodeUrl("ok\uD800", "value")).toThrow(ToolError);
  });
});

describe("decodeUrl", () => {
  it("round-trips Turkish text in every scope", () => {
    for (const scope of ["value", "url", "form"] as const) {
      expect(decodeUrl(encodeUrl("Şükrü & Ayşe", scope), scope)).toBe(
        "Şükrü & Ayşe",
      );
    }
  });

  it("reads + as a space only in form scope", () => {
    expect(decodeUrl("a+b%20c", "form")).toBe("a b c");
    expect(decodeUrl("a+b", "value")).toBe("a+b");
  });

  it("keeps reserved escapes in url scope", () => {
    expect(decodeUrl("a%2Fb%20c", "url")).toBe("a%2Fb c");
  });

  it("points at a truncated escape", () => {
    try {
      decodeUrl("abc%2Gx", "value");
      expect.unreachable();
    } catch (error) {
      const failure = error as ToolError;
      expect(failure).toBeInstanceOf(ToolError);
      expect(failure.detail.en).toContain('"%2G"');
      expect(failure.at).toEqual({ line: 1, column: 4 });
    }
    expect(() => decodeUrl("100%", "value")).toThrow(ToolError);
  });

  it("tells bytes that are not UTF-8 apart from a malformed escape", () => {
    try {
      decodeUrl("caf%C3%A9 %E7ay", "value");
      expect.unreachable();
    } catch (error) {
      const failure = error as ToolError;
      expect(failure.detail.tr).toContain("UTF-8 değil");
      expect(failure.at).toEqual({ line: 1, column: 11 });
    }
  });
});

describe("looksEncoded", () => {
  it("spots input that is already encoded", () => {
    expect(looksEncoded("a%20b")).toBe(true);
    expect(looksEncoded("a b")).toBe(false);
    expect(looksEncoded("100%")).toBe(false);
  });
});

describe("toScope", () => {
  it("falls back to value", () => {
    expect(toScope("form")).toBe("form");
    expect(toScope(true)).toBe("value");
  });
});
