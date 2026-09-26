import { describe, expect, it } from "vitest";
import { jsonToYaml, yamlNote, yamlToJson } from "./logic";

const back = async (yaml: string) => (await yamlToJson(yaml, 0)).text;

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

  it("writes flow style on one line for indent 0", async () => {
    const output = await jsonToYaml('{"a":{"b":[1,2]},"c":"x"}', 0);
    expect(output.trim()).toBe("{a: {b: [1, 2]}, c: x}");
  });

  it("round-trips for every indent choice", async () => {
    const json =
      '{"name":"Gökhan","tags":["a","b"],"nested":{"list":[{"x":1},{"y":null}],"no":"no","at":"22:30","empty":{}}}';
    for (const indent of [0, 2, 4]) {
      expect(await back(await jsonToYaml(json, indent))).toBe(json);
    }
  });

  it("reports invalid JSON", async () => {
    await expect(jsonToYaml("{nope}", 2)).rejects.toThrow(/Invalid JSON/);
  });

  it("recognises YAML pasted in the wrong direction", async () => {
    const error = await jsonToYaml("name: app\nport: 80", 2).catch(
      (cause) => cause,
    );
    expect(error.message).toMatch(/looks like YAML/);
    expect(error.action?.direction).toBe("yaml-to-json");
  });

  it("does not call a plain word YAML", async () => {
    await expect(jsonToYaml("hello", 2)).rejects.toThrow(/Invalid JSON/);
  });
});

describe("yamlToJson", () => {
  it("round-trips", async () => {
    const json = '{"name":"Gökhan","tags":["a","b"],"active":true}';
    expect(await back(await jsonToYaml(json, 2))).toBe(json);
  });

  it("does not turn Norway into false", async () => {
    const output = await back("country: no\nenabled: true\nswitch: on\ny: yes");
    expect(output).toBe(
      '{"country":"no","enabled":true,"switch":"on","y":"yes"}',
    );
  });

  it("does not read a time as a number", async () => {
    expect(await back("at: 22:30")).toBe('{"at":"22:30"}');
  });

  it("reads the YAML 1.2 core nulls and floats", async () => {
    expect(await back("a: ~\nb: Null\nc: NULL\nd:\ne: null\nf: .5")).toBe(
      '{"a":null,"b":null,"c":null,"d":null,"e":null,"f":0.5}',
    );
  });

  it("applies a compose-style merge key", async () => {
    const yaml = [
      "x-defaults: &defaults",
      "  restart: always",
      "  image: app",
      "services:",
      "  web:",
      "    <<: *defaults",
      "    image: web",
    ].join("\n");
    const output = JSON.parse(await back(yaml));
    expect(output.services.web).toEqual({ restart: "always", image: "web" });
  });

  it("gives one document as itself and several as an array", async () => {
    expect(await yamlToJson("a: 1", 0)).toEqual({
      text: '{"a":1}',
      documents: 1,
    });
    expect(await yamlToJson("a: 1\n---\nb: 2\n---\nc: 3", 0)).toEqual({
      text: '[{"a":1},{"b":2},{"c":3}]',
      documents: 3,
    });
  });

  it("reports malformed YAML with its line and a localized reason", async () => {
    const error = await yamlToJson("a:\n  - b\n - c", 0).catch((e) => e);
    expect(error.message).toMatch(/Could not parse the YAML: bad indentation/);
    expect(error.at).toEqual({ line: 3, column: 2 });
    expect(error.localized.tr).toMatch(/girinti hatalı/);
  });
});

describe("yamlNote", () => {
  it("mentions the document count only when there are several", () => {
    expect(yamlNote(1).en).not.toMatch(/documents/);
    expect(yamlNote(3).tr).toBe("3 doküman → dizi olarak verildi");
  });
});
