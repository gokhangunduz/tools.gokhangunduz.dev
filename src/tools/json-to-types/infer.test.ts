import { describe, expect, it } from "vitest";
import { infer, merge, pascalCase } from "./infer";

describe("infer", () => {
  it("separates integers from other numbers", () => {
    expect(infer(1)).toEqual({ kind: "integer" });
    expect(infer(1.5)).toEqual({ kind: "number" });
  });

  it("describes an empty array as unknown rather than guessing", () => {
    expect(infer([])).toEqual({ kind: "array", items: { kind: "unknown" } });
  });

  it("merges the elements of an array of objects", () => {
    const result = infer([{ a: 1 }, { a: 2, b: "x" }]);
    expect(result.kind).toBe("array");
    const items = result.kind === "array" ? result.items : null;
    expect(items?.kind).toBe("object");
    const fields = items?.kind === "object" ? items.fields : [];
    expect(fields.find((f) => f.name === "a")?.optional).toBe(false);
    // Present in one element only, so optional.
    expect(fields.find((f) => f.name === "b")?.optional).toBe(true);
  });
});

describe("merge", () => {
  it("widens int and float to one number", () => {
    expect(merge(infer(1), infer(1.5))).toEqual({ kind: "number" });
  });

  it("makes a union of genuinely different types", () => {
    const result = merge(infer("x"), infer(1));
    expect(result.kind).toBe("union");
  });

  it("does not duplicate the same type", () => {
    expect(merge(infer("x"), infer("y"))).toEqual({ kind: "string" });
  });
});

describe("pascalCase", () => {
  it("builds an identifier from a JSON key", () => {
    expect(pascalCase("user_name")).toBe("UserName");
    expect(pascalCase("created-at")).toBe("CreatedAt");
    expect(pascalCase("id")).toBe("Id");
  });

  it("keeps the result a legal identifier when the key starts with a digit", () => {
    expect(pascalCase("2fa")).toBe("F2fa");
  });
});
