import { describe, expect, it } from "vitest";
import { ToolError } from "../text-tool";
import {
  altText,
  byteLength,
  capacity,
  escapeWifi,
  toSvg,
  wifiPayload,
} from "./logic";

describe("toSvg", () => {
  it("produces an SVG with a viewBox", async () => {
    const svg = await toSvg("https://gokhangunduz.dev", "M", 2);
    expect(svg).toContain("<svg");
    expect(svg).toContain("viewBox");
  });

  it("encodes Turkish text", async () => {
    const svg = await toSvg("Şükrü'nün kartı", "M", 2);
    expect(svg).toContain("<svg");
  });

  it("keeps newlines, so a vCard survives", async () => {
    const card = "BEGIN:VCARD\nVERSION:3.0\nFN:Gökhan\nEND:VCARD";
    const one = await toSvg(card, "M", 4);
    const flat = await toSvg(card.replace(/\n/g, " "), "M", 4);
    expect(one).toContain("<svg");
    expect(one).not.toBe(flat);
  });

  it("gets denser with a higher correction level", async () => {
    const low = await toSvg("x".repeat(200), "L", 2);
    const high = await toSvg("x".repeat(200), "H", 2);
    const size = (svg: string) => Number(/viewBox="0 0 (\d+)/.exec(svg)![1]);
    expect(size(high)).toBeGreaterThan(size(low));
  });

  it("explains a payload that will not fit", async () => {
    await expect(toSvg("x".repeat(3000), "H", 2)).rejects.toThrow(/too long/);
  });

  it("returns empty for blank input", async () => {
    expect(await toSvg("  ", "M", 2)).toBe("");
  });
});

describe("capacity", () => {
  it("counts UTF-8 bytes", () => {
    expect(byteLength("ş")).toBe(2);
    expect(capacity("şş", "M").text.tr).toBe("4 / 2331 bayt");
    expect(capacity("şş", "M").tone).toBe("muted");
  });

  it("warns above 80%", () => {
    expect(capacity("x".repeat(1900), "M").tone).toBe("warning");
  });

  it("names the strongest level that still fits", () => {
    const over = capacity("x".repeat(2400), "M");
    expect(over.tone).toBe("destructive");
    expect(over.text.tr).toBe("2400 / 2331 bayt · L seviyesinde 2953 sığar");
    expect(over.text.en).toBe("2400 / 2331 bytes · level L fits 2953");
    expect(capacity("x".repeat(1500), "H").text.en).toContain(
      "level Q fits 1663",
    );
    expect(capacity("x".repeat(3000), "L").text.en).toContain(
      "too long for any level",
    );
  });
});

describe("wifiPayload", () => {
  it("builds a WPA payload", () => {
    expect(
      wifiPayload({
        ssid: "Ev",
        password: "gizli123",
        security: "WPA",
        hidden: false,
      }),
    ).toBe("WIFI:T:WPA;S:Ev;P:gizli123;;");
  });

  it("escapes special characters", () => {
    expect(escapeWifi('a;b,c:d\\e"f')).toBe('a\\;b\\,c\\:d\\\\e\\"f');
    expect(
      wifiPayload({
        ssid: "Kafe;2",
        password: "p:w",
        security: "WEP",
        hidden: true,
      }),
    ).toBe("WIFI:T:WEP;S:Kafe\\;2;P:p\\:w;H:true;;");
  });

  it("drops the password on an open network", () => {
    expect(
      wifiPayload({
        ssid: "Misafir",
        password: "x",
        security: "nopass",
        hidden: false,
      }),
    ).toBe("WIFI:T:nopass;S:Misafir;;");
  });

  it("names the missing field", () => {
    try {
      wifiPayload({ ssid: "Ev", password: "", security: "WPA", hidden: false });
      throw new Error("no throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ToolError);
      expect((error as ToolError).field).toBe("password");
    }
    expect(() =>
      wifiPayload({
        ssid: "",
        password: "",
        security: "nopass",
        hidden: false,
      }),
    ).toThrow(ToolError);
  });
});

describe("altText", () => {
  it("trims long payloads", () => {
    expect(altText("https://a.dev", "tr")).toBe("QR kod: https://a.dev");
    const long = altText("x".repeat(100), "en");
    expect(long.length).toBeLessThan(75);
    expect(long.endsWith("…")).toBe(true);
  });
});
