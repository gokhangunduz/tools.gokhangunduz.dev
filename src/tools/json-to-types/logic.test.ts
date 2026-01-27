import { describe, expect, it } from "vitest";
import { convert } from "./logic";

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
    expect(output).toContain('ZipCode string `json:"zip-code"`');
    expect(output).toContain("Tags []string");
  });

  it("uses a pointer and omitempty for an optional field", () => {
    const output = convert('[{"a":1},{"a":2,"b":"x"}]', "go", "Row");
    expect(output).toContain('B *string `json:"b,omitempty"`');
  });

  it("uses int64 for integers and float64 for the rest", () => {
    const output = convert(SAMPLE, "go", "User");
    expect(output).toContain("Id int64");
    expect(output).toContain("Score float64");
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
