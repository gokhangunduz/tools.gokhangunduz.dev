import { describe, expect, it } from "vitest";
import { parseCurl, toCode } from "./logic";

const DEVTOOLS = `curl 'https://api.x.dev/v1/orders' \\
  -H 'accept: application/json' \\
  -H 'content-type: application/json' \\
  --data-raw '{"sku":"A-1","qty":2}' \\
  --compressed`;

describe("parseCurl", () => {
  it("reads a devtools copy-as-cURL command", () => {
    const request = parseCurl(DEVTOOLS);
    expect(request.url).toBe("https://api.x.dev/v1/orders");
    // A body with no -X means POST, as curl itself does.
    expect(request.method).toBe("POST");
    expect(request.headers).toHaveLength(2);
    expect(request.body).toBe('{"sku":"A-1","qty":2}');
  });

  it("defaults to GET with no body", () => {
    expect(parseCurl("curl https://x.dev").method).toBe("GET");
  });

  it("turns -u into an Authorization header", () => {
    const request = parseCurl("curl -u user:pass https://x.dev");
    expect(request.headers[0][0]).toBe("Authorization");
    expect(request.headers[0][1]).toBe(`Basic ${btoa("user:pass")}`);
  });

  it("refuses a command that is not curl", () => {
    expect(() => parseCurl("wget https://x.dev")).toThrow();
  });

  it("refuses an option it does not understand, rather than dropping it", () => {
    expect(() => parseCurl("curl --cert x.pem https://x.dev")).toThrow(
      /Unrecognised/,
    );
  });

  it("refuses a header without a colon", () => {
    expect(() => parseCurl("curl -H 'broken' https://x.dev")).toThrow();
  });
});

describe("toCode", () => {
  it("writes a fetch call with headers and a parsed JSON body", () => {
    const output = toCode(DEVTOOLS, "fetch");
    expect(output).toContain('await fetch("https://api.x.dev/v1/orders"');
    expect(output).toContain('method: "POST"');
    expect(output).toContain('"content-type": "application/json"');
    // The body is an object literal, not a quoted string.
    expect(output).toContain('"sku": "A-1"');
    expect(output).not.toContain('body: "{');
  });

  it("writes an axios call with a lowercase method and data", () => {
    const output = toCode(DEVTOOLS, "axios");
    expect(output).toContain('import axios from "axios";');
    expect(output).toContain('method: "post"');
    expect(output).toContain("data: {");
  });

  it("keeps a non-JSON body as a string", () => {
    const output = toCode("curl -d 'a=1&b=2' https://x.dev", "fetch");
    expect(output).toContain('body: "a=1&b=2"');
  });

  it("returns empty for blank input", () => {
    expect(toCode("  ", "fetch")).toBe("");
  });
});
