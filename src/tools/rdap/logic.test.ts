import { describe, expect, it, vi } from "vitest";
import { formatRdap, lookupDomain } from "./logic";

const SAMPLE = {
  ldhName: "EXAMPLE.COM",
  handle: "2336799_DOMAIN_COM-VRSN",
  status: ["client delete prohibited"],
  events: [
    { eventAction: "registration", eventDate: "1995-08-14T04:00:00Z" },
    { eventAction: "expiration", eventDate: "2026-08-13T04:00:00Z" },
  ],
  entities: [
    {
      roles: ["registrar"],
      vcardArray: [
        "vcard",
        [["fn", {}, "text", "RESERVED-Internet Assigned Numbers Authority"]],
      ],
    },
  ],
  nameservers: [{ ldhName: "A.IANA-SERVERS.NET" }],
};

describe("formatRdap", () => {
  it("pulls out the fields anyone actually reads", () => {
    const output = formatRdap(SAMPLE, "en");
    expect(output).toContain("EXAMPLE.COM");
    expect(output).toContain("registration");
    expect(output).toContain("1995-08-14");
    expect(output).toContain("expiration");
    expect(output).toContain("RESERVED-Internet Assigned Numbers Authority");
    expect(output).toContain("a.iana-servers.net");
  });

  it("copes with a response missing most fields", () => {
    expect(formatRdap({ ldhName: "x.dev" }, "en")).toContain("x.dev");
  });
});

describe("lookupDomain", () => {
  it("strips a pasted URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => SAMPLE,
    });
    vi.stubGlobal("fetch", fetchMock);
    await lookupDomain("https://example.com/path", "en");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://rdap.org/domain/example.com",
    );
    vi.unstubAllGlobals();
  });

  it("explains a 404 as unregistered or unsupported", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    await expect(lookupDomain("nothing.example", "en")).rejects.toThrow(
      /unregistered/,
    );
    vi.unstubAllGlobals();
  });

  it("refuses a bare word without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupDomain("localhost", "en")).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
