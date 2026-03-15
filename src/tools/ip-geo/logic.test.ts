import { describe, expect, it, vi } from "vitest";
import { formatResult, lookupIp } from "./logic";

const SAMPLE = {
  success: true,
  ip: "8.8.8.8",
  type: "IPv4",
  country: "United States",
  country_code: "US",
  region: "California",
  city: "Mountain View",
  latitude: 37.4,
  longitude: -122.07,
  timezone: { id: "America/Los_Angeles", utc: "-07:00" },
  connection: { asn: 15169, org: "Google LLC", isp: "Google LLC" },
};

describe("formatResult", () => {
  it("prints the fields that came back", () => {
    const output = formatResult(SAMPLE, "en");
    expect(output).toContain("8.8.8.8");
    expect(output).toContain("United States (US)");
    expect(output).toContain("AS15169");
    expect(output).toContain("America/Los_Angeles (-07:00)");
  });

  it("says out loud that the location is an estimate", () => {
    expect(formatResult(SAMPLE, "en")).toContain("estimate");
    expect(formatResult(SAMPLE, "tr")).toContain("tahmin");
  });

  it("leaves out fields the service did not return", () => {
    const output = formatResult({ success: true, ip: "1.1.1.1" }, "en");
    expect(output).toContain("1.1.1.1");
    // The disclaimer mentions cities, so check the labelled row is absent.
    expect(output.split("\n")[1]).toBe("");
  });

  it("reports a failed lookup", () => {
    expect(() =>
      formatResult({ success: false, message: "Invalid IP address" }, "en"),
    ).toThrow(/Invalid IP/);
  });
});

describe("lookupIp", () => {
  it("asks about the browser's own address when given nothing", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => SAMPLE,
    });
    vi.stubGlobal("fetch", fetchMock);
    await lookupIp("  ", "en");
    expect(fetchMock.mock.calls[0][0]).toBe("https://ipwho.is/");
    vi.unstubAllGlobals();
  });

  it("refuses something that is not an address, without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupIp("example.com", "en")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
