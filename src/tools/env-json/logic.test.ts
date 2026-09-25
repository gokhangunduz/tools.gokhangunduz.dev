import { describe, expect, it } from "vitest";
import { envToJson, jsonToEnv } from "./logic";

describe("envToJson", () => {
  it("reads the shapes a real .env file has", () => {
    const env = [
      "# comment",
      "export NODE_ENV=production",
      "PORT=8080",
      'GREETING="merhaba dünya"',
      "EMPTY=",
      "URL=https://x.dev/a?b=1 # trailing comment",
    ].join("\n");

    expect(JSON.parse(envToJson(env, 0))).toEqual({
      NODE_ENV: "production",
      PORT: "8080",
      GREETING: "merhaba dünya",
      EMPTY: "",
      URL: "https://x.dev/a?b=1",
    });
  });

  it("expands escapes in double quotes and not in single quotes", () => {
    expect(JSON.parse(envToJson("A=\"a\\nb\"\nB='a\\nb'", 0))).toEqual({
      A: "a\nb",
      B: "a\\nb",
    });
  });

  it("reports a line with no =", () => {
    expect(() => envToJson("JUST_A_NAME", 0)).toThrow(/Line 1/);
  });

  it("reports an invalid variable name", () => {
    expect(() => envToJson("2FA=x", 0)).toThrow(/invalid variable name/);
  });
});

describe("jsonToEnv", () => {
  it("quotes only what needs quoting", () => {
    expect(jsonToEnv('{"A":"simple","B":"two words","C":8080}')).toBe(
      'A=simple\nB="two words"\nC=8080',
    );
  });

  it("refuses a nested value rather than flattening it", () => {
    expect(() => jsonToEnv('{"a":{"b":1}}')).toThrow(/flat values/);
  });

  it("round-trips", () => {
    const json = '{"NODE_ENV":"production","GREETING":"merhaba dünya"}';
    expect(envToJson(jsonToEnv(json), 0)).toBe(json);
  });
});
