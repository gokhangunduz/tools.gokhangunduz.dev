import { afterEach, describe, expect, it, vi } from "vitest";
import type { Localized } from "@/i18n";
import {
  buildUrl,
  COMMON_TYPES,
  formatAll,
  formatResponse,
  formatTtl,
  lookup,
  parseTarget,
  recordCount,
  reverseName,
  targetNote,
} from "./logic";

const A = { name: "example.com.", type: 1, TTL: 300, data: "93.184.216.34" };
const CNAME = {
  name: "www.example.com.",
  type: 5,
  TTL: 3600,
  data: "example.com.",
};

const label = (row: { label: Localized | string }) =>
  typeof row.label === "string" ? row.label : row.label.en;

afterEach(() => vi.unstubAllGlobals());

describe("buildUrl", () => {
  it("asks Cloudflare's resolver for the right record", () => {
    expect(buildUrl("example.com", "MX")).toBe(
      "https://cloudflare-dns.com/dns-query?name=example.com&type=MX",
    );
  });
});

describe("parseTarget", () => {
  it("strips a URL down to its host", () => {
    expect(parseTarget("https://example.com:8443/a/b?c=1#d")?.name).toBe(
      "example.com",
    );
    expect(parseTarget("example.com/path")?.name).toBe("example.com");
    expect(parseTarget("Example.COM.")?.name).toBe("example.com");
  });

  it("turns an internationalised name into punycode", () => {
    const target = parseTarget("münchen.de");
    expect(target?.name).toBe("xn--mnchen-3ya.de");
    expect(targetNote("münchen.de")?.en).toContain("xn--mnchen-3ya.de");
    expect(targetNote("example.com")).toBeNull();
  });

  it("turns an IP into its reverse-lookup name", () => {
    expect(parseTarget("8.8.8.8")).toMatchObject({
      name: "8.8.8.8.in-addr.arpa",
      reverse: true,
    });
    expect(reverseName("2001:db8::1")).toBe(
      "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa",
    );
    expect(targetNote("8.8.8.8")?.tr).toContain("PTR");
  });

  it("refuses what is not a name", () => {
    expect(() => parseTarget("not a domain!")).toThrow();
    expect(() => parseTarget("a..b")).toThrow();
    expect(parseTarget("   ")).toBeNull();
  });
});

describe("formatTtl", () => {
  it("reads like a duration", () => {
    expect(formatTtl(45, "tr")).toBe("45 sn");
    expect(formatTtl(300, "tr")).toBe("5 dk");
    expect(formatTtl(300, "en")).toBe("5 min");
    expect(formatTtl(5400, "en")).toBe("1 h 30 min");
    expect(formatTtl(86_400, "tr")).toBe("1 gün");
  });
});

describe("formatResponse", () => {
  it("lists answers as rows, and in dig format for copying", () => {
    const result = formatResponse(
      { Status: 0, Answer: [A] },
      "A",
      "example.com",
      "en",
    );
    expect(result.text).toBe("example.com.\t300\tIN\tA\t93.184.216.34");
    expect(result.rows).toHaveLength(1);
    expect(label(result.rows![0])).toBe("A · 5 min");
    expect(result.rows![0].value).toBe("93.184.216.34");
    expect(result.rows![0].hint).toBeUndefined();
  });

  it("names the owner only when it differs from the query", () => {
    const result = formatResponse(
      { Status: 0, Answer: [CNAME, A] },
      "A",
      "www.example.com",
      "en",
    );
    expect(result.rows![0].hint).toBeUndefined();
    expect(result.rows![1].hint?.en).toBe("example.com.");
  });

  it("makes NXDOMAIN a notice with nothing to copy", () => {
    const result = formatResponse({ Status: 3 }, "A", "nope.example", "tr");
    expect(result.text).toBe("");
    expect(label(result.rows![0])).toBe("NXDOMAIN");
    expect(result.rows![0].value).toBe("Böyle bir alan adı yok.");
    expect(result.rows![0].copy).toBe(false);
  });

  it("names SERVFAIL and REFUSED", () => {
    expect(label(formatResponse({ Status: 2 }, "A", "x", "en").rows![0])).toBe(
      "SERVFAIL",
    );
    expect(label(formatResponse({ Status: 5 }, "A", "x", "en").rows![0])).toBe(
      "REFUSED",
    );
  });

  it("says no records, with only the SOA primary as the authority", () => {
    const result = formatResponse(
      {
        Status: 0,
        Answer: [],
        Authority: [
          {
            name: "example.com.",
            type: 6,
            TTL: 3600,
            data: "ns.icann.org. noc.dns.icann.org. 2024 7200 3600 1209600 3600",
          },
        ],
      },
      "MX",
      "example.com",
      "en",
    );
    expect(result.text).toBe("");
    expect(result.rows![0].value).toBe("no records");
    expect(result.rows![0].copy).toBe(false);
    expect(result.rows![1].value).toBe("ns.icann.org.");
    expect(result.rows![1].copy).toBeUndefined();
  });
});

describe("formatAll", () => {
  it("groups by type, drops duplicates, and says which types are empty", () => {
    const bodies = COMMON_TYPES.map((type) =>
      type === "A" || type === "CNAME"
        ? { Status: 0, Answer: [CNAME, A] }
        : { Status: 0, Answer: [] },
    );
    const result = formatAll(bodies, "www.example.com", "en");
    const groups = result.groups!;
    expect(groups.map((g) => g.label)).toEqual(COMMON_TYPES);
    expect(groups[0].rows).toHaveLength(1);
    expect(groups[2].rows[0].value).toBe("example.com.");
    expect(groups[3].rows[0].value).toBe("no records");
    expect(result.text.split("\n")).toHaveLength(2);
  });

  it("reports NXDOMAIN once rather than per type", () => {
    const result = formatAll(
      COMMON_TYPES.map(() => ({ Status: 3 })),
      "nope.example",
      "en",
    );
    expect(result.groups).toBeUndefined();
    expect(label(result.rows![0])).toBe("NXDOMAIN");
  });
});

describe("recordCount", () => {
  it("counts the lines of the copied text", () => {
    expect(recordCount("a\nb")?.en).toBe("2 records");
    expect(recordCount("a")?.tr).toBe("1 kayıt");
    expect(recordCount("")).toBeNull();
  });
});

describe("lookup", () => {
  const empty = () =>
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ Status: 0, Answer: [] }),
    });

  it("strips a pasted URL down to the host", async () => {
    const fetchMock = empty();
    vi.stubGlobal("fetch", fetchMock);
    await lookup("https://example.com/a/b?c=1", "A", "en");
    expect(fetchMock.mock.calls[0][0]).toContain("name=example.com&");
  });

  it("asks for PTR when given an IP", async () => {
    const fetchMock = empty();
    vi.stubGlobal("fetch", fetchMock);
    await lookup("8.8.8.8", "A", "en");
    expect(fetchMock.mock.calls[0][0]).toContain(
      "name=8.8.8.8.in-addr.arpa&type=PTR",
    );
  });

  it("asks for every common type at once for All", async () => {
    const fetchMock = empty();
    vi.stubGlobal("fetch", fetchMock);
    await lookup("example.com", "ALL", "en");
    expect(fetchMock).toHaveBeenCalledTimes(COMMON_TYPES.length);
  });

  it("refuses something that is not a domain, without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookup("not a domain!", "A", "en")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a resolver error in its own words", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );
    const error = await lookup("example.com", "A", "en").catch((e: Error) => e);
    expect((error as Error).message).toMatch(/not answering/);
    expect((error as Error).message).not.toContain("502");
  });

  it("returns empty for blank input", async () => {
    expect(await lookup("  ", "A", "en")).toEqual({ text: "" });
  });
});
