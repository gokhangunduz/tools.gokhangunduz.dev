import { describe, expect, it } from "vitest";
import { csvToJson, jsonToCsv } from "./logic";

describe("jsonToCsv", () => {
  it("writes a header row from the keys", async () => {
    const output = await jsonToCsv('[{"a":1,"b":"x"},{"a":2,"b":"y"}]', ",");
    expect(output.split("\n")[0]).toBe("a,b");
    expect(output).toContain("2,y");
  });

  it("quotes a value containing the delimiter", async () => {
    const output = await jsonToCsv('[{"a":"bir, iki"}]', ",");
    expect(output).toContain('"bir, iki"');
  });

  it("writes a nested value as JSON in the cell", async () => {
    const output = await jsonToCsv('[{"tags":["a","b"]}]', ",");
    expect(output).toContain('"[""a"",""b""]"');
  });

  it("refuses anything that is not an array of objects", async () => {
    await expect(jsonToCsv('{"a":1}', ",")).rejects.toThrow();
    await expect(jsonToCsv("[1,2]", ",")).rejects.toThrow();
  });
});

describe("csvToJson", () => {
  it("uses the header row as keys and types the values", async () => {
    const output = await csvToJson("a,b\n1,x\n2,y", ",", 0);
    expect(output).toBe('[{"a":1,"b":"x"},{"a":2,"b":"y"}]');
  });

  it("handles a semicolon-delimited file", async () => {
    expect(await csvToJson("a;b\n1;x", ";", 0)).toBe('[{"a":1,"b":"x"}]');
  });

  it("round-trips", async () => {
    const json = '[{"name":"Gökhan","city":"İstanbul"}]';
    expect(await csvToJson(await jsonToCsv(json, ","), ",", 0)).toBe(json);
  });
});
