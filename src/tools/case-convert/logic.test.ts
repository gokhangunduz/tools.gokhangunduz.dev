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

  it("splits camelCase humps, acronyms and every separator", () => {
    expect(splitWords("getHTTPResponse_code-2")).toEqual([
      "get",
      "HTTP",
      "Response",
      "code",
      "2",
    ]);
    expect(splitWords("kullanıcıAdıŞifre")).toEqual([
      "kullanıcı",
      "Adı",
      "Şifre",
    ]);
  });

  it("uses English rules for identifiers even with the Turkish switch on", () => {
    expect(convertCase("user_id", "camel", true)).toBe("userId");
    expect(convertCase("user id", "constant", true)).toBe("USER_ID");
    expect(convertCase("İl ilçe", "snake", true)).toBe("il_ilçe");
  });

  it("can transliterate identifiers to ASCII", () => {
    expect(convertCase("kullanıcı-adı", "camel", true, true)).toBe(
      "kullaniciAdi",
    );
    expect(convertCase("İl ilçe listesi", "kebab", true, true)).toBe(
      "il-ilce-listesi",
    );
    expect(convertCase("kullanıcı adı", "upper", true, true)).toBe(
      "KULLANICI ADI",
    );
  });

  it("uses Turkish casing for prose by default", () => {
    // The whole point: "I" lowercases to "ı" and "i" uppercases to "İ".
    expect(convertCase("IŞIK", "lower", true)).toBe("ışık");
    expect(convertCase("istanbul", "upper", true)).toBe("İSTANBUL");
  });

  it("uses English casing for prose when asked", () => {
    expect(convertCase("ID", "lower", false)).toBe("id");
    expect(convertCase("ID", "lower", true)).toBe("ıd");
  });

  it("converts line by line and keeps blank lines", () => {
    expect(convertCase("user_id\n\ngetHTTPResponse", "camel", true)).toBe(
      "userId\n\ngetHttpResponse",
    );
    expect(convertCase("a b\r\nc d", "snake", true)).toBe("a_b\nc_d");
  });

  it("capitalises sentences per line", () => {
    expect(convertCase("bir cümle.\nikinci cümle.", "sentence", true)).toBe(
      "Bir cümle.\nİkinci cümle.",
    );
  });

  it("leaves minor words lowercase in a title", () => {
    expect(convertCase("kasa ve defter", "title", true)).toBe("Kasa ve Defter");
  });

  it("keeps acronyms in titles and sentences", () => {
    expect(convertCase("the JSON API guide", "title", false)).toBe(
      "The JSON API Guide",
    );
    expect(convertCase("bu JSON dosyası", "sentence", true)).toBe(
      "Bu JSON dosyası",
    );
  });

  it("does not treat an all-caps line as acronyms", () => {
    expect(convertCase("IŞIK HIZI", "title", true)).toBe("Işık Hızı");
  });

  it("returns empty for empty input", () => {
    expect(convertCase("", "camel", true)).toBe("");
  });
});
