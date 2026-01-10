import { describe, expect, it } from "vitest";
import { decodeEntities, encodeEntities } from "./logic";

describe("encodeEntities", () => {
  it("escapes the five that matter", () => {
    expect(encodeEntities(`<a href="x">&'</a>`, false)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;",
    );
  });

  it("escapes & first, so nothing is double-encoded wrongly", () => {
    expect(encodeEntities("&lt;", false)).toBe("&amp;lt;");
  });

  it("leaves Turkish text alone by default", () => {
    expect(encodeEntities("Şükrü", false)).toBe("Şükrü");
  });

  it("encodes non-ASCII as entities when asked", () => {
    expect(encodeEntities("é", true)).toBe("&#233;");
    expect(encodeEntities("©", true)).toBe("&copy;");
  });

  it("keeps an emoji in one piece", () => {
    expect(encodeEntities("👋", true)).toBe("&#128075;");
    expect(decodeEntities(encodeEntities("👋", true))).toBe("👋");
  });
});

describe("decodeEntities", () => {
  it("handles named, decimal and hex references", () => {
    expect(decodeEntities("&lt;b&gt; &#199; &#xe7;")).toBe("<b> Ç ç");
  });

  it("leaves an unknown entity as written", () => {
    expect(decodeEntities("&nosuchthing; &")).toBe("&nosuchthing; &");
  });

  it("does not execute markup", () => {
    // The whole reason this is not innerHTML.
    expect(decodeEntities("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe(
      "<script>alert(1)</script>",
    );
  });
});
