import { describe, expect, it } from "vitest";
import { jsonToToml, tomlToJson } from "./logic";

describe("jsonToToml", () => {
  it("writes tables and arrays", async () => {
    const output = await jsonToToml(
      '{"title":"site","server":{"port":8080,"hosts":["a","b"]}}',
    );
    expect(output).toContain('title = "site"');
    expect(output).toContain("[server]");
    expect(output).toContain("port = 8080");
  });

  it("names the key that TOML cannot represent", async () => {
    await expect(jsonToToml('{"a":{"b":null}}')).rejects.toThrow(/a\.b/);
  });

  it("refuses a top-level array, which TOML has no syntax for", async () => {
    await expect(jsonToToml("[1,2]")).rejects.toThrow();
  });
});

describe("tomlToJson", () => {
  it("round-trips", async () => {
    const json = '{"name":"tools","port":8080,"tags":["a","b"]}';
    expect(await tomlToJson(await jsonToToml(json), 0)).toBe(json);
  });

  it("reads dates as TOML defines them", async () => {
    const output = await tomlToJson("released = 2026-09-25", 0);
    expect(output).toContain("2026-09-25");
  });

  it("reports malformed TOML", async () => {
    await expect(tomlToJson("a = = 1", 0)).rejects.toThrow(/Could not parse/);
  });
});
