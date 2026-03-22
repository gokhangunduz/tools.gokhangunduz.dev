import { describe, expect, it } from "vitest";
import { parseUserAgent } from "./logic";

function value(output: string, label: string): string {
  return output
    .split("\n")
    .find((row) => row.startsWith(label))!
    .split(/\s{2,}/)[1];
}

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15";
const EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0";

describe("parseUserAgent", () => {
  it("does not report Chrome as Safari", () => {
    expect(value(parseUserAgent(CHROME), "browser")).toBe("Chrome 140.0.0.0");
    expect(value(parseUserAgent(SAFARI), "browser")).toBe("Safari 18.2");
  });

  it("does not report Edge as Chrome", () => {
    expect(value(parseUserAgent(EDGE), "browser")).toBe("Edge 140.0.0.0");
  });

  it("names the engine", () => {
    expect(value(parseUserAgent(CHROME), "engine")).toBe("Blink");
    expect(value(parseUserAgent(SAFARI), "engine")).toBe("WebKit");
  });

  it("reads the operating system", () => {
    expect(value(parseUserAgent(CHROME), "os")).toBe("macOS 10.15.7");
    expect(value(parseUserAgent(EDGE), "os")).toBe("Windows 10 / 11");
  });

  it("tells a phone from a tablet from a desktop", () => {
    expect(value(parseUserAgent(CHROME), "device")).toBe("desktop");
    expect(
      value(
        parseUserAgent(
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1",
        ),
        "device",
      ),
    ).toBe("phone (iPhone)");
  });

  it("flags crawlers and command-line clients", () => {
    expect(
      value(
        parseUserAgent(
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        ),
        "bot",
      ),
    ).toBe("Googlebot");
    expect(value(parseUserAgent("curl/8.4.0"), "bot")).toBe("curl");
  });

  it("returns empty for blank input", () => {
    expect(parseUserAgent("  ")).toBe("");
  });
});
