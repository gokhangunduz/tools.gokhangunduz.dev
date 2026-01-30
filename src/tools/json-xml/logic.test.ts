import { describe, expect, it } from "vitest";
import { jsonToXml, xmlToJson } from "./logic";

describe("xmlToJson", () => {
  it("keeps attributes distinct from child elements", async () => {
    const output = await xmlToJson('<item sku="A-1">Klavye</item>', 0);
    expect(output).toContain('"@_sku":"A-1"');
    expect(output).toContain('"#text":"Klavye"');
  });

  it("keeps a value that only looks like a number", async () => {
    expect(await xmlToJson("<a><code>007</code></a>", 0)).toContain('"007"');
  });

  it("reports invalid XML by line", async () => {
    await expect(xmlToJson("<a><b></a>", 0)).rejects.toThrow(/Invalid XML/);
  });
});

describe("jsonToXml", () => {
  it("round-trips a document with attributes", async () => {
    const xml = '<item sku="A-1">Klavye</item>';
    const back = await jsonToXml(await xmlToJson(xml, 0));
    expect(back).toContain('sku="A-1"');
    expect(back).toContain("Klavye");
  });

  it("refuses input with more than one root", async () => {
    await expect(jsonToXml('{"a":1,"b":2}')).rejects.toThrow(/one root/);
  });

  it("refuses a top-level array", async () => {
    await expect(jsonToXml("[1,2]")).rejects.toThrow();
  });
});
