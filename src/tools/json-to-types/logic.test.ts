import { describe, expect, it } from "vitest";
import {
  convert as run,
  goName,
  singular,
  typesNote,
  type Target,
} from "./logic";

const convert = (input: string, target: Target, name: string) =>
  run(input, target, name).text;

const SAMPLE = JSON.stringify({
  id: 1,
  name: "Gökhan",
  active: true,
  score: 4.5,
  tags: ["a", "b"],
  profile: { city: "İstanbul", "zip-code": "34000" },
  deleted_at: null,
});

describe("TypeScript output", () => {
  it("names nested objects instead of inlining them", () => {
    const output = convert(SAMPLE, "typescript", "User");
    expect(output).toContain("interface User {");
    expect(output).toContain("interface Profile {");
    expect(output).toContain("profile: Profile;");
  });

  it("quotes a key that is not an identifier", () => {
    expect(convert(SAMPLE, "typescript", "User")).toContain(
      '"zip-code": string;',
    );
  });

  it("marks a field missing from one element of an array as optional", () => {
    const output = convert('[{"a":1},{"a":2,"b":"x"}]', "typescript", "Row");
    expect(output).toContain("b?: string;");
  });

  it("types an array of scalars", () => {
    expect(convert(SAMPLE, "typescript", "User")).toContain("tags: string[];");
  });
});

describe("TypeScript naming", () => {
  const TWO_DATA = JSON.stringify({
    data: { id: 1 },
    order: { data: { total: 2.5 } },
    invoice: { data: { id: 7 } },
  });

  it("exports every declaration", () => {
    const output = convert(SAMPLE, "typescript", "User");
    expect(output).toContain("export interface User {");
    expect(output).toContain("export interface Profile {");
    expect(output).not.toMatch(/^interface/m);
  });

  it("reuses a name for the same shape and prefixes the parent for another", () => {
    const output = convert(TWO_DATA, "typescript", "Root");
    expect(output).toContain("export interface Data {\n  id: number;\n}");
    expect(output).toContain(
      "export interface OrderData {\n  total: number;\n}",
    );
    expect(output).toContain("data: OrderData;");
    expect(output.match(/interface Data\b/g)).toHaveLength(1);
    expect(output).not.toContain("InvoiceData");
  });

  it("does the same in Go", () => {
    const output = convert(TWO_DATA, "go", "Root");
    expect(output).toContain("type Data struct {");
    expect(output).toContain("type OrderData struct {");
    expect(output).toMatch(/Data +OrderData +`json:"data"`/);
    expect(output).not.toContain("InvoiceData");
  });

  it("merges an empty array with a filled one", () => {
    const output = convert('[{"tags":["a"]},{"tags":[]}]', "typescript", "Row");
    expect(output).toContain("tags: string[];");
  });

  it("types a field only seen as null as unknown | null", () => {
    const output = convert('{"a":null,"b":"x"}', "typescript", "Row");
    expect(output).toContain("a: unknown | null;");
    expect(convert('[{"a":null},{"a":"x"}]', "typescript", "Row")).toContain(
      "a: null | string;",
    );
  });

  it("names the element of a root array after the root", () => {
    expect(convert('[{"a":1}]', "typescript", "Rows")).toContain(
      "export type Rows = Row[];",
    );
    const output = convert('[{"a":1}]', "typescript", "Row");
    expect(output).toContain("export type Row = RowItem[];");
    expect(output).toContain("export interface RowItem {");
  });
});

describe("Go formatting", () => {
  it("aligns fields the way gofmt does", () => {
    const output = convert('{"id":1,"avatar_url":"x"}', "go", "User");
    expect(output).toBe(
      [
        "type User struct {",
        '\tID        int64  `json:"id"`',
        '\tAvatarURL string `json:"avatar_url"`',
        "}",
      ].join("\n"),
    );
  });

  it("uses Go's initialisms", () => {
    expect(goName("user_id")).toBe("UserID");
    expect(goName("apiURL")).toBe("APIURL");
    expect(goName("uuid")).toBe("UUID");
    expect(goName("ip_address")).toBe("IPAddress");
    expect(goName("idle")).toBe("Idle");
  });
});

describe("singular", () => {
  it("handles the common English plurals", () => {
    expect(singular("Users")).toBe("User");
    expect(singular("Categories")).toBe("Category");
    expect(singular("Addresses")).toBe("Address");
    expect(singular("Boxes")).toBe("Box");
    expect(singular("Matches")).toBe("Match");
    expect(singular("Dishes")).toBe("Dish");
    expect(singular("Class")).toBe("ClassItem");
    expect(singular("Data")).toBe("DataItem");
  });
});

describe("typesNote", () => {
  it("counts the types and the null-only fields", () => {
    const result = run(SAMPLE, "typescript", "User");
    expect(result.declarations).toBe(2);
    expect(result.nullOnly).toBe(1);
    expect(typesNote(result, "typescript").tr).toBe(
      "2 tip · TypeScript · 1 alan yalnız null görüldü",
    );
    expect(typesNote(run('{"a":1}', "zod", "X"), "zod").en).toBe("Zod");
  });
});

describe("Zod output", () => {
  it("builds a schema and infers the type from it", () => {
    const output = convert(SAMPLE, "zod", "User");
    expect(output).toContain('import { z } from "zod";');
    expect(output).toContain("z.object({");
    expect(output).toContain("z.number().int()");
    expect(output).toContain("export type User = z.infer<typeof userSchema>;");
  });

  it("marks optional fields optional", () => {
    expect(convert('[{"a":1},{"a":2,"b":"x"}]', "zod", "Row")).toContain(
      ".optional()",
    );
  });
});

describe("Go output", () => {
  it("writes struct tags with the original key", () => {
    const output = convert(SAMPLE, "go", "User");
    expect(output).toContain("type User struct {");
    expect(output).toMatch(/ZipCode +string +`json:"zip-code"`/);
    expect(output).toMatch(/Tags +\[\]string/);
  });

  it("uses a pointer and omitempty for an optional field", () => {
    const output = convert('[{"a":1},{"a":2,"b":"x"}]', "go", "Row");
    expect(output).toMatch(/B +\*string +`json:"b,omitempty"`/);
  });

  it("uses int64 for integers and float64 for the rest", () => {
    const output = convert(SAMPLE, "go", "User");
    expect(output).toMatch(/\tID +int64 /);
    expect(output).toMatch(/\tScore +float64 /);
  });
});

describe("JSON Schema output", () => {
  it("lists the required properties", () => {
    const schema = JSON.parse(convert(SAMPLE, "json-schema", "User"));
    expect(schema.type).toBe("object");
    expect(schema.properties.name).toEqual({ type: "string" });
    expect(schema.required).toContain("name");
  });

  it("leaves an optional field out of required", () => {
    const schema = JSON.parse(
      convert('[{"a":1},{"a":2,"b":"x"}]', "json-schema", "Row"),
    );
    expect(schema.items.required).toEqual(["a"]);
  });
});

describe("convert", () => {
  it("reports invalid JSON", () => {
    expect(() => convert("{nope}", "typescript", "X")).toThrow(/Invalid JSON/);
  });

  it("returns empty for blank input", () => {
    expect(convert("  ", "typescript", "X")).toBe("");
  });
});
