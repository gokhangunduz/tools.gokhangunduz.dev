import { describe, expect, it, vi } from "vitest";
import { buildUrl, formatResponse, lookup } from "./logic";

describe("buildUrl", () => {
  it("asks Cloudflare's resolver for the right record", () => {
    expect(buildUrl("example.com", "MX")).toBe(
      "https://cloudflare-dns.com/dns-query?name=example.com&type=MX",
    );
  });
});

describe("formatResponse", () => {
  it("lists answers with their TTL and type", () => {
    const output = formatResponse(
      {
        Status: 0,
        Answer: [
          { name: "example.com", type: 1, TTL: 300, data: "93.184.216.34" },
        ],
      },
      "en",
    );
    expect(output).toContain("example.com");
    expect(output).toContain("300");
    expect(output).toContain("A");
    expect(output).toContain("93.184.216.34");
  });

  it("says NXDOMAIN in plain words", () => {
    expect(formatResponse({ Status: 3 }, "en")).toContain("no such domain");
  });

  it("distinguishes no records from no domain", () => {
    expect(formatResponse({ Status: 0, Answer: [] }, "en")).toContain(
      "No records",
    );
  });
});

describe("lookup", () => {
  it("strips a pasted URL down to the host", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await lookup("https://example.com/a/b?c=1", "A", "en");
    expect(fetchMock.mock.calls[0][0]).toContain("name=example.com");
    vi.unstubAllGlobals();
  });

  it("refuses something that is not a domain, without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookup("not a domain!", "A", "en")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("reports a resolver error rather than throwing raw", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );
    await expect(lookup("example.com", "A", "en")).rejects.toThrow(/502/);
    vi.unstubAllGlobals();
  });

  it("returns empty for blank input", async () => {
    expect(await lookup("  ", "A", "en")).toBe("");
  });
});
