import { describe, expect, it } from "vitest";
import { ToolError } from "@/tools/text-tool";
import { locateJsonError, parseJson } from "./json";

function problem(input: string) {
  const found = locateJsonError(input);
  return found && { offset: found.offset, en: found.message.en };
}

describe("locateJsonError", () => {
  it("accepts valid JSON", () => {
    expect(locateJsonError('{"a": [1, -2.5e3, "x\\n", true, null]}')).toBe(
      null,
    );
    expect(locateJsonError("  42 ")).toBe(null);
  });

  it("points at the character that breaks the document", () => {
    expect(problem('{"a": 1 "b": 2}')).toEqual({
      offset: 8,
      en: "expected a comma or }",
    });
    expect(problem("[1, 2 3]")).toEqual({
      offset: 6,
      en: "expected a comma or ]",
    });
    expect(problem('{"a" 1}')).toEqual({
      offset: 5,
      en: "expected : after the key",
    });
    expect(problem("{a: 1}")).toEqual({
      offset: 1,
      en: "expected a double-quoted key",
    });
    expect(problem('{"a": }')).toEqual({ offset: 6, en: "expected a value" });
    expect(problem('{"a": 1')).toEqual({
      offset: 7,
      en: "the JSON ends too early",
    });
    expect(problem("")).toEqual({ offset: 0, en: "the input is empty" });
    expect(problem("{} x")).toEqual({
      offset: 3,
      en: "unexpected content after the JSON value",
    });
  });

  it("names the usual mistakes", () => {
    expect(problem('{"a": 1,}')?.en).toBe(
      "a trailing comma is not allowed in JSON",
    );
    expect(problem("[1,]")).toEqual({
      offset: 2,
      en: "a trailing comma is not allowed in JSON",
    });
    expect(problem("{'a': 1}")?.en).toBe("JSON strings use double quotes");
    expect(problem('{"a": 1 // x\n}')?.en).toBe("JSON does not allow comments");
    expect(problem('"abc')?.en).toBe("unterminated string");
    expect(problem('"a\\x"')?.en).toBe("invalid escape sequence");
    expect(problem("01")?.en).toBe("invalid number");
    expect(problem('"a\tb"')?.en).toBe(
      "unescaped control character in a string",
    );
  });
});

describe("parseJson", () => {
  it("parses valid input", () => {
    expect(parseJson('{"a":[1]}')).toEqual({ a: [1] });
  });

  it("throws a localized error with a line and column, never the engine text", () => {
    try {
      parseJson('{\n  "a": 1,\n  "b": 2\n  "c": 3\n}');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      const e = error as ToolError;
      expect(e.at).toEqual({ line: 4, column: 3 });
      expect(e.detail).toEqual({
        tr: "Geçersiz JSON: virgül ya da } bekleniyordu",
        en: "Invalid JSON: expected a comma or }",
      });
      expect(e.localized.tr).toBe(
        "Geçersiz JSON: virgül ya da } bekleniyordu (satır 4, sütun 3)",
      );
      expect(e.message).not.toMatch(/position|Unexpected/);
    }
  });
});
