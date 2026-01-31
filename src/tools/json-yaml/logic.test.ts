import { describe, expect, it } from "vitest";
import { jsonToYaml, yamlToJson } from "./logic";

describe("jsonToYaml", () => {
  it("converts nested structures", async () => {
    const output = await jsonToYaml('{"a":{"b":[1,2]}}', 2);
    expect(output).toContain("a:");
    expect(output).toContain("  b:");
    expect(output).toContain("    - 1");
  });

  it("keeps long strings on one line", async () => {
    const url = `https://example.com/${"x".repeat(200)}`;
    const output = await jsonToYaml(JSON.stringify({ url }), 2);
    expect(output.split("\n").filter(Boolean)).toHaveLength(1);
  });

  it("reports invalid JSON", async () => {
    await expect(jsonToYaml("{nope}", 2)).rejects.toThrow(/Invalid JSON/);
  });
});

describe("yamlToJson", () => {
  it("round-trips", async () => {
    const json = '{"name":"Gökhan","tags":["a","b"],"active":true}';
    expect(await yamlToJson(await jsonToYaml(json, 2), 0)).toBe(json);
  });

  it("does not turn Norway into false", async () => {
    // The default YAML schema reads `no` as a boolean; this must not.
    const output = await yamlToJson("country: no\nenabled: true", 0);
    expect(output).toBe('{"country":"no","enabled":true}');
  });

  it("does not read a time as a number", async () => {
    expect(await yamlToJson("at: 22:30", 0)).toBe('{"at":"22:30"}');
  });

  it("reports malformed YAML with its line", async () => {
    await expect(yamlToJson("a:\n  - b\n - c", 0)).rejects.toThrow(
      /Could not parse/,
    );
  });
});
