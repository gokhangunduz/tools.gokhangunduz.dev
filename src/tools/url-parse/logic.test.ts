import { describe, expect, it } from "vitest";
import type { ResultRow, TextResult } from "../text-tool";
import { classify, decodePunycode, hostToUnicode, parseUrl } from "./logic";

function rows(result: TextResult, group = 0): Record<string, ResultRow> {
  return Object.fromEntries(
    (result.groups?.[group]?.rows ?? []).map((r) => [String(r.label), r]),
  );
}

function values(result: TextResult, group = 0): Record<string, string> {
  return Object.fromEntries(
    Object.entries(rows(result, group)).map(([k, r]) => [k, r.value]),
  );
}

describe("parseUrl", () => {
  it("lists the parts and the query", () => {
    const result = parseUrl("https://x.dev:8443/a/b?q=bir%20iki&r=2#top");
    expect(values(result)).toMatchObject({
      origin: "https://x.dev:8443",
      scheme: "https",
      host: "x.dev:8443",
      port: "8443",
      path: "/a/b",
      search: "?q=bir%20iki&r=2",
      fragment: "top",
    });
    expect(Object.keys(values(result))[0]).toBe("origin");
    const query = result.groups!.at(-1)!;
    expect(query.label).toEqual({ tr: "Query (2)", en: "Query (2)" });
    expect(query.rows[0]).toEqual({ label: "q", value: "bir iki" });
    expect(result.text).toContain("query (2)");
    expect(result.text).toContain("bir iki");
  });

  it("marks a default port instead of mixing languages into the value", () => {
    const port = rows(parseUrl("https://x.dev/"))["port"];
    expect(port.value).toBe("443");
    expect(port.hint).toEqual({ tr: "varsayılan", en: "default" });
  });

  it("keeps a password out of the output", () => {
    const result = parseUrl("https://user:hunter2@x.dev/");
    expect(values(result).user).toBe("user");
    expect(result.text).not.toContain("hunter2");
  });

  it("shows a Turkish host, path and fragment readably", () => {
    const result = parseUrl(
      "https://örnek.com.tr/ürünler/çanta?renk=kırmızı#yorumlar-ş",
    );
    const parts = values(result);
    expect(parts.host).toBe("örnek.com.tr");
    expect(parts["host (ASCII)"]).toBe("xn--rnek-4qa.com.tr");
    expect(parts.origin).toBe("https://örnek.com.tr");
    expect(parts.path).toBe("/ürünler/çanta");
    expect(parts.fragment).toBe("yorumlar-ş");
    expect(values(result, 1)).toEqual({ "1": "ürünler", "2": "çanta" });
    expect(values(result, 2)).toEqual({ renk: "kırmızı" });
  });

  it("leaves a malformed escape in the path as written", () => {
    expect(values(parseUrl("https://x.dev/100%25/%E7")).path).toBe(
      "/100%25/%E7",
    );
  });

  it("numbers duplicate keys and marks empty values", () => {
    const result = parseUrl("https://x.dev/?tag=a&tag=b&empty=");
    const query = rows(result, 1);
    expect(query["tag [0]"].value).toBe("a");
    expect(query["tag [1]"].value).toBe("b");
    expect(query["empty"]).toMatchObject({
      value: "",
      hint: { tr: "(boş)", en: "(empty)" },
    });
  });

  it("assumes https for a bare host", () => {
    expect(values(parseUrl("x.dev/a")).host).toBe("x.dev");
    expect(values(parseUrl("localhost:3000/api")).port).toBe("3000");
  });

  it("parses a relative reference without inventing a host", () => {
    const parts = values(parseUrl("/a/b?x=1#f"));
    expect(parts).toEqual({
      path: "/a/b",
      search: "?x=1",
      fragment: "f",
    });
  });

  it("rejects text that is not a URL", () => {
    expect(() => parseUrl("not a url")).toThrow();
  });

  it("returns nothing for empty input", () => {
    expect(parseUrl("   ").text).toBe("");
  });
});

describe("classify", () => {
  it("tells the input kinds apart", () => {
    expect(classify("https://x.dev")).toBe("absolute");
    expect(classify("mailto:a@b.dev")).toBe("absolute");
    expect(classify("x.dev:8080/a")).toBe("schemeless");
    expect(classify("?q=1")).toBe("relative");
    expect(classify("")).toBeNull();
  });
});

describe("punycode", () => {
  it("decodes internationalized labels", () => {
    expect(decodePunycode("mnchen-3ya")).toBe("münchen");
    expect(decodePunycode("wgv71a")).toBe("日本");
    expect(hostToUnicode("xn--gndz-0rac.dev")).toBe("gündüz.dev");
  });

  it("leaves a broken label as written", () => {
    expect(hostToUnicode("xn--!!.dev")).toBe("xn--!!.dev");
  });
});
