import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResultGroup, ResultRow } from "../text-tool";
import {
  formatRdap,
  lookupDomain,
  parseDomain,
  queryNote,
  relativeTime,
  type Rdap,
} from "./logic";

const NOW = new Date("2026-09-26T12:00:00Z");

const SAMPLE: Rdap = {
  ldhName: "EXAMPLE.COM",
  status: ["client delete prohibited", "client transfer prohibited"],
  events: [
    { eventAction: "registration", eventDate: "1995-08-14T04:00:00Z" },
    { eventAction: "last changed", eventDate: "2026-08-14T07:01:34Z" },
    { eventAction: "expiration", eventDate: "2027-08-13T04:00:00Z" },
  ],
  entities: [
    {
      roles: ["registrar"],
      publicIds: [{ type: "IANA Registrar ID", identifier: "376" }],
      vcardArray: [
        "vcard",
        [
          ["version", {}, "text", "4.0"],
          ["fn", {}, "text", "RESERVED-Internet Assigned Numbers Authority"],
        ],
      ],
      entities: [
        {
          roles: ["abuse"],
          vcardArray: [
            "vcard",
            [
              ["fn", {}, "text", ""],
              ["tel", { type: "voice" }, "uri", "tel:+1.3103015800"],
              ["email", {}, "text", "abuse@iana.org"],
            ],
          ],
        },
      ],
    },
  ],
  nameservers: [
    { ldhName: "A.IANA-SERVERS.NET" },
    { ldhName: "B.IANA-SERVERS.NET" },
  ],
  secureDNS: {
    delegationSigned: true,
    dsData: [{ keyTag: 370, algorithm: 13 }],
  },
};

const text = (label: ResultRow["label"] | ResultGroup["label"]) =>
  typeof label === "string" ? label : label.en;

function row(groups: ResultGroup[] | undefined, label: string) {
  return groups
    ?.flatMap((group) => group.rows)
    .find((item) => text(item.label) === label);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseDomain", () => {
  it("reduces a URL to its host and drops www", () => {
    expect(parseDomain("https://www.Example.com/a?b=1")).toEqual({
      name: "example.com",
      typed: "www.example.com",
    });
  });

  it("turns an internationalised name into punycode", () => {
    expect(parseDomain("münchen.de")?.name).toBe("xn--mnchen-3ya.de");
  });

  it("keeps other subdomains as typed", () => {
    expect(parseDomain("api.example.com")?.name).toBe("api.example.com");
  });

  it("returns null for blank input", () => {
    expect(parseDomain("   ")).toBeNull();
  });

  it.each([
    ["localhost", /TLD/],
    ["8.8.8.8", /not IP addresses/],
    ["[::1]", /not IP addresses/],
    ["exa mple.com", /does not look like/],
    ["-bad.com", /does not look like/],
    ["example.c0m", /does not look like/],
    ["under_score.com", /does not look like/],
  ])("refuses %s", (input, message) => {
    expect(() => parseDomain(input)).toThrow(message);
  });
});

describe("queryNote", () => {
  it("says what was asked when it differs from the input", () => {
    expect(queryNote("https://www.example.com/")?.en).toBe(
      "Looked up as example.com.",
    );
    expect(queryNote("münchen.de")?.tr).toBe(
      "xn--mnchen-3ya.de olarak soruldu.",
    );
  });

  it("stays quiet otherwise", () => {
    expect(queryNote("example.com")).toBeNull();
    expect(queryNote("not a domain")).toBeNull();
  });
});

describe("relativeTime", () => {
  const at = (days: number) => new Date(NOW.getTime() + days * 86_400_000);

  it("uses days, months and years by distance", () => {
    expect(relativeTime(at(12), NOW)).toEqual({
      tr: "12 gün sonra",
      en: "in 12 days",
    });
    expect(relativeTime(at(-1), NOW)).toEqual({
      tr: "1 gün önce",
      en: "1 day ago",
    });
    expect(relativeTime(at(0), NOW).tr).toBe("bugün");
    expect(relativeTime(at(120), NOW).en).toBe("in 4 months");
    expect(relativeTime(at(-365 * 31), NOW).tr).toBe("30 yıl önce");
  });
});

describe("formatRdap", () => {
  it("groups the fields anyone actually reads", () => {
    const result = formatRdap(SAMPLE, "en", NOW);
    expect(result.groups?.map((group) => text(group.label))).toEqual([
      "Domain",
      "Registrar",
      "DNS",
    ]);
    expect(row(result.groups, "Domain")?.value).toBe("example.com");
    expect(row(result.groups, "Status")?.value).toBe(
      "client delete prohibited, client transfer prohibited",
    );
    expect(row(result.groups, "Created")?.value).toBe("1995-08-14");
    expect(row(result.groups, "Updated")?.value).toBe("2026-08-14");
    expect(row(result.groups, "Expires")).toMatchObject({
      value: "2027-08-13",
      hint: { en: "in 11 months" },
      tone: undefined,
    });
    expect(row(result.groups, "Registrar")?.value).toBe(
      "RESERVED-Internet Assigned Numbers Authority",
    );
    expect(row(result.groups, "IANA ID")?.value).toBe("376");
    expect(row(result.groups, "Abuse email")?.value).toBe("abuse@iana.org");
    expect(row(result.groups, "Abuse phone")?.value).toBe("+1.3103015800");
    expect(
      result.groups?.[2].rows
        .filter((item) => text(item.label) === "Nameserver")
        .map((item) => item.value),
    ).toEqual(["a.iana-servers.net", "b.iana-servers.net"]);
    expect(row(result.groups, "DNSSEC")).toMatchObject({
      value: "signed",
      tone: "success",
      hint: { en: "DS 370 · alg 13" },
    });
  });

  it("writes a plain text version in the page's language", () => {
    const tr = formatRdap(SAMPLE, "tr", NOW).text;
    expect(tr).toContain("Bitiş tarihi");
    expect(tr).toMatch(/2027-08-13 {2}\(11 ay sonra\)/);
    expect(tr).toContain("imzalı");
    expect(tr.split("\n\n")).toHaveLength(3);
  });

  it("warns when expiry is within 30 days, and flags an expired domain", () => {
    const expiring = (date: string) =>
      row(
        formatRdap(
          {
            ldhName: "x.dev",
            events: [{ eventAction: "expiration", eventDate: date }],
          },
          "tr",
          NOW,
        ).groups,
        "Expires",
      );
    expect(expiring("2026-10-10T00:00:00Z")).toMatchObject({
      tone: "warning",
      hint: { tr: "14 gün sonra" },
    });
    expect(expiring("2026-09-20T00:00:00Z")?.tone).toBe("destructive");
    expect(expiring("2026-12-30T00:00:00Z")?.tone).toBeUndefined();
  });

  it("marks a held or deleting domain's status", () => {
    const tone = (status: string[]) =>
      row(formatRdap({ ldhName: "x.dev", status }, "en", NOW).groups, "Status")
        ?.tone;
    expect(tone(["client hold"])).toBe("warning");
    expect(tone(["redemption period"])).toBe("destructive");
    expect(tone(["active"])).toBeUndefined();
  });

  it("finds a top-level abuse contact and an unsigned zone", () => {
    const result = formatRdap(
      {
        ldhName: "x.dev",
        entities: [
          {
            roles: ["abuse"],
            vcardArray: ["vcard", [["email", {}, "text", "abuse@x.dev"]]],
          },
        ],
        secureDNS: { delegationSigned: false },
      },
      "tr",
      NOW,
    );
    expect(row(result.groups, "Abuse email")?.value).toBe("abuse@x.dev");
    expect(row(result.groups, "DNSSEC")).toMatchObject({
      value: "imzasız",
      tone: "muted",
    });
  });

  it("copes with a response missing most fields", () => {
    const result = formatRdap({ ldhName: "x.dev" }, "en", NOW);
    expect(result.groups).toHaveLength(1);
    expect(result.text).toContain("x.dev");
  });
});

describe("lookupDomain", () => {
  const respond = (
    init: Partial<Omit<Response, "body">> & { data?: unknown },
  ) =>
    vi.fn().mockResolvedValue({
      ok: (init.status ?? 200) < 400,
      status: 200,
      redirected: true,
      json: async () => init.data,
      ...init,
    });

  it("asks rdap.org for the cleaned-up domain", async () => {
    const fetchMock = respond({ data: SAMPLE });
    vi.stubGlobal("fetch", fetchMock);
    const result = await lookupDomain(
      "https://www.example.com/path",
      "en",
      NOW,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://rdap.org/domain/example.com",
    );
    expect(row(result.groups, "Registrar")).toBeDefined();
  });

  it("refuses bad input without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupDomain("localhost", "en")).rejects.toThrow();
    await expect(lookupDomain("1.2.3.4", "en")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty for blank input", async () => {
    expect(await lookupDomain("  ", "en")).toEqual({ text: "" });
  });

  it("tells an unsupported TLD from an unregistered domain", async () => {
    vi.stubGlobal("fetch", respond({ status: 404, redirected: false }));
    await expect(lookupDomain("example.com.tr", "en")).rejects.toThrow(
      "There is no RDAP server for .tr.",
    );

    vi.stubGlobal("fetch", respond({ status: 404, redirected: true }));
    await expect(lookupDomain("nothing-here.com", "en")).rejects.toThrow(
      /No registration found for nothing-here\.com; it may be available\.$/,
    );
    await expect(lookupDomain("a.nothing-here.com", "en")).rejects.toThrow(
      /rather than a subdomain/,
    );
  });

  it.each([
    [429, /Too many lookups/],
    [503, /not answering right now/],
  ])("explains HTTP %i without the raw status", async (status, message) => {
    vi.stubGlobal("fetch", respond({ status }));
    const error = await lookupDomain("example.com", "en").catch(
      (e: Error) => e,
    );
    expect((error as Error).message).toMatch(message);
    expect((error as Error).message).not.toContain(String(status));
  });

  it("explains a failed request and an unreadable answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    const error = await lookupDomain("example.com", "tr").catch((e) => e);
    expect(error.localized.tr).toMatch(/^Sorgu gönderilemedi/);
    expect(error.message).not.toContain("Failed to fetch");

    vi.stubGlobal(
      "fetch",
      respond({
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      }),
    );
    await expect(lookupDomain("example.com", "en")).rejects.toThrow(
      "The RDAP server's answer could not be read.",
    );
  });
});
