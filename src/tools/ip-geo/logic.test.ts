import { afterEach, describe, expect, it, vi } from "vitest";
import type { Localized } from "@/i18n";
import {
  disclaimer,
  formatResult,
  localRange,
  lookupIp,
  parseIp,
  placeOf,
} from "./logic";

const SAMPLE = {
  success: true,
  ip: "8.8.8.8",
  type: "IPv4",
  country: "United States",
  country_code: "US",
  region: "California",
  city: "Mountain View",
  latitude: 37.38605,
  longitude: -122.08385,
  timezone: { id: "America/Los_Angeles", utc: "-07:00" },
  connection: { asn: 15169, org: "Google LLC", isp: "Google LLC" },
};

function row(result: ReturnType<typeof formatResult>, label: string) {
  return result.rows?.find((r) => (r.label as Localized).en === label);
}

function range(input: string) {
  return localRange(parseIp(input)!)?.en ?? null;
}

afterEach(() => vi.unstubAllGlobals());

describe("formatResult", () => {
  it("returns the fields as labelled rows", () => {
    const result = formatResult(SAMPLE, "en");
    expect(row(result, "IP")?.value).toBe("8.8.8.8");
    expect(row(result, "Country")?.value).toBe("United States (US)");
    expect(row(result, "ASN")?.value).toBe("AS15169");
    expect(row(result, "Time zone")?.value).toBe(
      "America/Los_Angeles (UTC-07:00)",
    );
    expect(row(result, "Coordinates ≈")?.value).toBe("37.39, -122.08");
    expect(row(result, "ISP")?.value).toBe("Google LLC");
  });

  it("labels in Turkish", () => {
    const { text } = formatResult(SAMPLE, "tr");
    expect(text).toMatch(/^Şehir\s+Mountain View$/m);
    expect(text).toMatch(/^Servis sağlayıcı\s+Google LLC$/m);
  });

  it("marks the visitor's own address", () => {
    expect(row(formatResult(SAMPLE, "en", true), "IP")?.hint?.en).toBe(
      "Your address",
    );
    expect(row(formatResult(SAMPLE, "en"), "IP")?.hint).toBeUndefined();
  });

  it("leaves out fields the service did not return", () => {
    const result = formatResult({ success: true, ip: "1.1.1.1" }, "en");
    expect(result.rows).toHaveLength(1);
    expect(result.text).toMatch(/^IP\s+1\.1\.1\.1$/);
  });

  it("maps service messages to its own words, never echoing them", () => {
    const failure = (message: string) => {
      try {
        formatResult({ success: false, message }, "en");
      } catch (error) {
        return (error as Error).message;
      }
      return "";
    };
    expect(failure("Invalid IP address")).toMatch(/does not look like/);
    expect(failure("Reserved range")).toMatch(/reserved range/);
    expect(failure("You've hit the monthly limit")).toMatch(/limit/);
    expect(failure("<b>Something odd</b>")).not.toContain("odd");
  });
});

describe("placeOf and disclaimer", () => {
  it("reads the city and country code back from the text", () => {
    expect(placeOf(formatResult(SAMPLE, "en").text)).toBe("Mountain View, US");
    expect(placeOf(formatResult(SAMPLE, "tr").text)).toBe("Mountain View, US");
    expect(placeOf("")).toBeNull();
  });

  it("says the location is an estimate, in both languages", () => {
    expect(disclaimer("x")?.en).toContain("estimate");
    expect(disclaimer("x")?.tr).toContain("tahmin");
    expect(disclaimer("")).toBeNull();
  });
});

describe("parseIp", () => {
  it("reads IPv4 and IPv6", () => {
    expect(parseIp("8.8.8.8")?.version).toBe(4);
    expect(parseIp("2001:4860:4860::8888")?.groups).toEqual([
      0x2001, 0x4860, 0x4860, 0, 0, 0, 0, 0x8888,
    ]);
    expect(parseIp("[::1]")?.groups).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    expect(parseIp("::ffff:10.0.0.1")?.groups.slice(5)).toEqual([
      0xffff, 0x0a00, 0x0001,
    ]);
    expect(parseIp("  ")).toBeNull();
  });

  it("refuses what is not an address", () => {
    for (const bad of [
      "example.com",
      "1.2.3",
      "1.2.3.256",
      "1::2::3",
      "1:2:3:4:5:6:7:8:9",
      "12345::",
    ]) {
      expect(() => parseIp(bad)).toThrow();
    }
  });
});

describe("localRange", () => {
  it("knows the addresses that have no location", () => {
    expect(range("192.168.1.1")).toContain("RFC 1918");
    expect(range("172.20.0.1")).toContain("RFC 1918");
    expect(range("127.0.0.1")).toContain("loopback");
    expect(range("100.64.1.1")).toContain("RFC 6598");
    expect(range("169.254.1.1")).toContain("link-local");
    expect(range("203.0.113.5")).toContain("documentation");
    expect(range("::1")).toContain("loopback");
    expect(range("fe80::1")).toContain("link-local");
    expect(range("fd12:3456::1")).toContain("ULA");
    expect(range("2001:db8::1")).toContain("documentation");
    expect(range("::ffff:192.168.0.1")).toContain("RFC 1918");
  });

  it("passes public addresses through", () => {
    expect(range("8.8.8.8")).toBeNull();
    expect(range("172.32.0.1")).toBeNull();
    expect(range("2606:4700:4700::1111")).toBeNull();
  });
});

describe("lookupIp", () => {
  const ok = () =>
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => SAMPLE,
    });

  it("asks about the browser's own address when given nothing", async () => {
    const fetchMock = ok();
    vi.stubGlobal("fetch", fetchMock);
    const result = await lookupIp("  ", "en");
    expect(fetchMock.mock.calls[0][0]).toBe("https://ipwho.is/");
    expect(row(result, "IP")?.hint?.en).toBe("Your address");
  });

  it("refuses something that is not an address, without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupIp("example.com", "en")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers a private address locally, without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupIp("192.168.1.1", "tr")).rejects.toMatchObject({
      localized: {
        tr: "192.168.1.1 özel ağ adresi (RFC 1918); internette konumu yoktur.",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not print a bare HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );
    const error = await lookupIp("8.8.8.8", "en").catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain("502");
  });
});
