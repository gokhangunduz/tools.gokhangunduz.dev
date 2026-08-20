import { describe, expect, it } from "vitest";
import { csvNote, csvToJson, jsonToCsv, typeCell } from "./logic";

const comma = { delimiter: "," };
const read = async (csv: string, delimiter = "", typed = true) =>
  (await csvToJson(csv, { delimiter, indent: 0, typed })).text;

describe("jsonToCsv", () => {
  it("writes a header row from the keys", async () => {
    const output = await jsonToCsv('[{"a":1,"b":"x"},{"a":2,"b":"y"}]', comma);
    expect(output.split("\n")[0]).toBe("a,b");
    expect(output).toContain("2,y");
  });

  it("builds the header from every row's keys, in first-appearance order", async () => {
    const output = await jsonToCsv('[{"a":1},{"b":2,"a":3},{"c":4}]', comma);
    expect(output).toBe("a,b,c\n1,,\n3,2,\n,,4");
  });

  it("quotes a value containing the delimiter", async () => {
    const output = await jsonToCsv('[{"a":"bir, iki"}]', comma);
    expect(output).toContain('"bir, iki"');
  });

  it("writes a nested value as JSON in the cell", async () => {
    const output = await jsonToCsv('[{"tags":["a","b"]}]', comma);
    expect(output).toContain('"[""a"",""b""]"');
  });

  it("writes an Excel file with a BOM and semicolons", async () => {
    const output = await jsonToCsv('[{"a":1,"b":"ş"}]', {
      delimiter: ",",
      excel: true,
    });
    expect(output).toBe("\uFEFFa;b\n1;ş");
  });

  it("refuses anything that is not an array of objects", async () => {
    await expect(jsonToCsv('{"a":1}', comma)).rejects.toThrow(/array/);
    await expect(jsonToCsv("[1,2]", comma)).rejects.toThrow();
  });
});

describe("csvToJson", () => {
  it("uses the header row as keys and types the values", async () => {
    expect(await read("a,b,c\n1,x,true\n2.5,y,false", ",")).toBe(
      '[{"a":1,"b":"x","c":true},{"a":2.5,"b":"y","c":false}]',
    );
  });

  it("keeps leading zeros and long digit strings as text", async () => {
    expect(
      await read("tel,zip,id\n05321234567,06100,1234567890123456", ","),
    ).toBe('[{"tel":"05321234567","zip":"06100","id":"1234567890123456"}]');
  });

  it("leaves every value a string when typing is off", async () => {
    expect(await read("a,b\n1,true", ",", false)).toBe(
      '[{"a":"1","b":"true"}]',
    );
  });

  it("handles a semicolon-delimited file", async () => {
    expect(await read("a;b\n1;x", ";")).toBe('[{"a":1,"b":"x"}]');
  });

  it("detects the delimiter when set to auto", async () => {
    const { text, info } = await csvToJson("a;b\n1;x\n2;y", {
      delimiter: "",
      indent: 0,
    });
    expect(text).toBe('[{"a":1,"b":"x"},{"a":2,"b":"y"}]');
    expect(info).toMatchObject({
      delimiter: ";",
      detected: true,
      rows: 2,
      columns: 2,
    });
  });

  it("reports rows with the wrong column count and drops __parsed_extra", async () => {
    const { text, info } = await csvToJson("a,b\n1,2\n3,4,5\n6", {
      delimiter: ",",
      indent: 0,
    });
    expect(text).not.toContain("__parsed_extra");
    expect(info?.mismatched).toEqual([3, 4]);
  });

  it("reports a broken quote with its line", async () => {
    const error = await read('a,b\n1,2\n"3,4', ",").catch((e) => e);
    expect(error.message).toMatch(/Could not read the CSV: a quote/);
    expect(error.at?.line).toBe(3);
  });

  it("round-trips", async () => {
    const json = '[{"name":"Gökhan","city":"İstanbul"}]';
    expect(await read(await jsonToCsv(json, comma), ",")).toBe(json);
  });

  it("reads back an Excel export", async () => {
    const csv = await jsonToCsv('[{"a":1,"b":"x"}]', {
      delimiter: ",",
      excel: true,
    });
    expect(await read(csv)).toBe('[{"a":1,"b":"x"}]');
  });
});

describe("typeCell", () => {
  it("types what looks like a number or boolean", () => {
    expect(typeCell("42")).toBe(42);
    expect(typeCell("-0.5")).toBe(-0.5);
    expect(typeCell("0")).toBe(0);
    expect(typeCell("TRUE")).toBe(true);
    expect(typeCell("")).toBeNull();
    expect(typeCell("1e3")).toBe(1000);
    expect(typeCell("1,5")).toBe("1,5");
  });
});

describe("csvNote", () => {
  const base = {
    delimiter: ",",
    detected: false,
    rows: 3,
    columns: 2,
    mismatched: [],
    header: ["a", "b"],
  };

  it("gives the size, and the delimiter when it was detected", () => {
    expect(csvNote(base).tr).toBe("3 satır · 2 sütun");
    expect(csvNote({ ...base, detected: true, delimiter: "\t" }).en).toBe(
      "Delimiter: tab (detected) · 3 rows · 2 columns",
    );
  });

  it("hints at a delimiter hidden in a single-column header", () => {
    const note = csvNote({ ...base, columns: 1, header: ["a;b"] });
    expect(note.tr).toContain("başlıkta noktalı virgül var");
  });

  it("lists the mismatched lines", () => {
    expect(csvNote({ ...base, mismatched: [4, 7] }).en).toContain(
      "column count differs on line 4, 7",
    );
  });
});
