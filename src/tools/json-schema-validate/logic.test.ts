import { describe, expect, it } from "vitest";
import { validateAgainstSchema } from "./logic";

const SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer", minimum: 0 },
    email: { type: "string", format: "email" },
  },
  required: ["name", "age"],
});

describe("validateAgainstSchema", () => {
  it("accepts a document that matches", async () => {
    const output = await validateAgainstSchema(
      SCHEMA,
      '{"name":"Gökhan","age":33}',
    );
    expect(output).toContain("✓");
  });

  it("lists every error, with its path", async () => {
    const output = await validateAgainstSchema(SCHEMA, '{"age":-1}');
    expect(output).toContain("required");
    expect(output).toContain("/age");
    expect(output.split("\n").length).toBeGreaterThan(1);
  });

  it("checks formats, which ajv leaves off by default", async () => {
    const output = await validateAgainstSchema(
      SCHEMA,
      '{"name":"x","age":1,"email":"not-an-email"}',
    );
    expect(output).toContain("/email");
  });

  it("reports a schema it cannot compile", async () => {
    await expect(
      validateAgainstSchema('{"type":"nonsense"}', "{}"),
    ).rejects.toThrow(/compile/);
  });

  it("asks for whichever side is missing", async () => {
    await expect(validateAgainstSchema("", '{"a":1}')).rejects.toThrow(
      /schema/,
    );
    await expect(validateAgainstSchema(SCHEMA, "")).rejects.toThrow(/data/);
  });
});
