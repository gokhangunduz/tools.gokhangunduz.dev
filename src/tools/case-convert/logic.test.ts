import { describe, expect, it } from "vitest";
import { convertCase, splitWords } from "./logic";

describe("convertCase", () => {
  it("converts between the identifier styles", () => {
    expect(convertCase("user name", "camel", false)).toBe("userName");
    expect(convertCase("user name", "pascal", false)).toBe("UserName");
    expect(convertCase("userName", "snake", false)).toBe("user_name");
    expect(convertCase("userName", "kebab", false)).toBe("user-name");
    expect(convertCase("userName", "constant", false)).toBe("USER_NAME");
  });

  it("splits camelCase humps and every separator", () => {
    expect(splitWords("getHTTPResponse_code-2")).toEqual([
      "get",
      "HTTPResponse",
      "code",
      "2",
    ]);
  });

  it("uses Turkish casing by default", () => {
    // The whole point: "I" lowercases to "ı" and "i" uppercases to "İ".
    expect(convertCase("IŞIK", "lower", true)).toBe("ışık");
    expect(convertCase("istanbul", "upper", true)).toBe("İSTANBUL");
  });

  it("uses English casing when asked, which identifiers need", () => {
    expect(convertCase("ID", "lower", false)).toBe("id");
    expect(convertCase("ID", "lower", true)).toBe("ıd");
  });

  it("capitalises sentences per line", () => {
    expect(convertCase("bir cümle.\nikinci cümle.", "sentence", true)).toBe(
      "Bir cümle.\nİkinci cümle.",
    );
  });

  it("leaves minor words lowercase in a title", () => {
    expect(convertCase("kasa ve defter", "title", true)).toBe("Kasa ve Defter");
  });

  it("returns empty for empty input", () => {
    expect(convertCase("", "camel", true)).toBe("");
  });
});
