import type { Locale, Localized } from "@/i18n";
import { ToolError, type ResultRow, type TextResult } from "../text-tool";

/**
 * Where an address is, roughly, and who announces it.
 *
 * ipwho.is answers with permissive CORS and needs no key. The accuracy of any
 * of these services is city-level at best and frequently wrong about VPN exit
 * nodes, so the output says what it is rather than implying a street address.
 * Addresses that have no place on the internet are answered here, without a
 * request.
 */
type Result = {
  success?: boolean;
  message?: string;
  ip?: string;
  type?: string;
  continent?: string;
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: { id?: string; utc?: string };
  connection?: { asn?: number; org?: string; isp?: string };
};

export type ParsedIp = { version: 4 | 6; address: string; groups: number[] };

const INVALID = new ToolError({
  tr: "IP adresi geçersiz görünüyor.",
  en: "That does not look like an IP address.",
});

function parseIpv4(text: string): number[] | null {
  const parts = text.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) =>
    /^\d{1,3}$/.test(part) ? Number(part) : NaN,
  );
  return octets.every((octet) => octet <= 255) ? octets : null;
}

/** The eight 16-bit groups of an IPv6 address, or null. */
function parseIpv6(text: string): number[] | null {
  if (!/^[0-9a-f:.]+$/i.test(text)) return null;
  let head = text;
  const tail: number[] = [];
  const dotted = /^(.*:)(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (dotted) {
    const v4 = parseIpv4(dotted[2]);
    if (!v4) return null;
    head = dotted[1].endsWith("::") ? dotted[1] : dotted[1].slice(0, -1);
    tail.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]);
  }

  const halves = head.split("::");
  if (halves.length > 2) return null;
  const read = (part: string) =>
    part === ""
      ? []
      : part
          .split(":")
          .map((g) => (/^[0-9a-f]{1,4}$/i.test(g) ? parseInt(g, 16) : NaN));
  const left = read(halves[0]);
  const right = halves.length === 2 ? [...read(halves[1]), ...tail] : [];
  const leftAll = halves.length === 2 ? left : [...left, ...tail];
  if ([...leftAll, ...right].some(Number.isNaN)) return null;

  const missing = 8 - leftAll.length - right.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  return [...leftAll, ...Array<number>(Math.max(missing, 0)).fill(0), ...right];
}

export function parseIp(input: string): ParsedIp | null {
  const address = input.trim().replace(/^\[(.*)\]$/, "$1");
  if (!address) return null;
  const v4 = parseIpv4(address);
  if (v4) return { version: 4, address, groups: v4 };
  const v6 = parseIpv6(address);
  if (v6) return { version: 6, address: address.toLowerCase(), groups: v6 };
  throw INVALID;
}

type Range = { tr: string; en: string };

const V4_RANGES: [number[], number, Range][] = [
  [
    [0, 0, 0, 0],
    8,
    {
      tr: '"bu ağ" adresi (RFC 1122)',
      en: 'a "this network" address (RFC 1122)',
    },
  ],
  [
    [10, 0, 0, 0],
    8,
    {
      tr: "özel ağ adresi (RFC 1918)",
      en: "a private network address (RFC 1918)",
    },
  ],
  [
    [172, 16, 0, 0],
    12,
    {
      tr: "özel ağ adresi (RFC 1918)",
      en: "a private network address (RFC 1918)",
    },
  ],
  [
    [192, 168, 0, 0],
    16,
    {
      tr: "özel ağ adresi (RFC 1918)",
      en: "a private network address (RFC 1918)",
    },
  ],
  [
    [100, 64, 0, 0],
    10,
    {
      tr: "operatörün CGNAT adresi (RFC 6598)",
      en: "a carrier-grade NAT address (RFC 6598)",
    },
  ],
  [[127, 0, 0, 0], 8, { tr: "loopback adresi", en: "a loopback address" }],
  [
    [169, 254, 0, 0],
    16,
    { tr: "link-local adresi", en: "a link-local address" },
  ],
  [
    [192, 0, 2, 0],
    24,
    {
      tr: "dokümantasyon adresi (TEST-NET-1)",
      en: "a documentation address (TEST-NET-1)",
    },
  ],
  [
    [198, 51, 100, 0],
    24,
    {
      tr: "dokümantasyon adresi (TEST-NET-2)",
      en: "a documentation address (TEST-NET-2)",
    },
  ],
  [
    [203, 0, 113, 0],
    24,
    {
      tr: "dokümantasyon adresi (TEST-NET-3)",
      en: "a documentation address (TEST-NET-3)",
    },
  ],
  [
    [198, 18, 0, 0],
    15,
    {
      tr: "benchmark adresi (RFC 2544)",
      en: "a benchmarking address (RFC 2544)",
    },
  ],
  [[224, 0, 0, 0], 4, { tr: "multicast adresi", en: "a multicast address" }],
  [[240, 0, 0, 0], 4, { tr: "ayrılmış bir adres", en: "a reserved address" }],
];

const V6_RANGES: [number[], number, Range][] = [
  [
    [0, 0, 0, 0, 0, 0, 0, 0],
    128,
    { tr: "belirtilmemiş adres (::)", en: "the unspecified address (::)" },
  ],
  [
    [0, 0, 0, 0, 0, 0, 0, 1],
    128,
    { tr: "loopback adresi", en: "a loopback address" },
  ],
  [
    [0xfe80, 0, 0, 0, 0, 0, 0, 0],
    10,
    { tr: "link-local adresi", en: "a link-local address" },
  ],
  [
    [0xfc00, 0, 0, 0, 0, 0, 0, 0],
    7,
    {
      tr: "özel ağ adresi (ULA, RFC 4193)",
      en: "a private network address (ULA, RFC 4193)",
    },
  ],
  [
    [0x2001, 0x0db8, 0, 0, 0, 0, 0, 0],
    32,
    {
      tr: "dokümantasyon adresi (RFC 3849)",
      en: "a documentation address (RFC 3849)",
    },
  ],
  [
    [0xff00, 0, 0, 0, 0, 0, 0, 0],
    8,
    { tr: "multicast adresi", en: "a multicast address" },
  ],
];

function inRange(
  groups: number[],
  base: number[],
  prefix: number,
  width: number,
): boolean {
  let bits = prefix;
  for (let i = 0; i < groups.length && bits > 0; i += 1) {
    const take = Math.min(bits, width);
    const mask = ((1 << take) - 1) << (width - take);
    if ((groups[i] & mask) !== (base[i] & mask)) return false;
    bits -= take;
  }
  return true;
}

/** Why an address has no location, or null when it is an ordinary public one. */
export function localRange(ip: ParsedIp): Range | null {
  if (ip.version === 4) {
    return (
      V4_RANGES.find(([base, prefix]) =>
        inRange(ip.groups, base, prefix, 8),
      )?.[2] ?? null
    );
  }
  const g = ip.groups;
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    const v4 = [g[6] >> 8, g[6] & 0xff, g[7] >> 8, g[7] & 0xff];
    return localRange({ version: 4, address: v4.join("."), groups: v4 });
  }
  return (
    V6_RANGES.find(([base, prefix]) => inRange(g, base, prefix, 16))?.[2] ??
    null
  );
}

const DISCLAIMER: Localized = {
  tr: "Konum şehir düzeyinde bir tahmindir; VPN ve mobil ağlarda sık sık yanlıştır.",
  en: "The location is a city-level estimate, and is often wrong for VPNs and mobile networks.",
};

export function disclaimer(output: string): Localized | null {
  return output ? DISCLAIMER : null;
}

function serviceError(message: string | undefined): ToolError {
  const text = message ?? "";
  if (/limit|quota|rate/i.test(text)) return LIMITED;
  if (/reserved|private|bogon/i.test(text)) {
    return new ToolError({
      tr: "Bu adres ayrılmış bir aralıkta; internette konumu yoktur.",
      en: "This address is in a reserved range; it has no location on the internet.",
    });
  }
  if (/invalid/i.test(text)) return INVALID;
  return new ToolError({
    tr: "Servis bu adres için sonuç döndürmedi.",
    en: "The service returned no result for this address.",
  });
}

const LIMITED = new ToolError({
  tr: "Servisin istek sınırı doldu; biraz sonra yeniden dene.",
  en: "The service's request limit is reached; try again in a while.",
});

const UNAVAILABLE = new ToolError({
  tr: "Servis şu an yanıt vermiyor; biraz sonra yeniden dene.",
  en: "The service is not answering right now; try again in a while.",
});

export function formatResult(
  body: Result,
  locale: Locale,
  own = false,
): TextResult {
  if (body.success === false) throw serviceError(body.message);

  const coordinates =
    typeof body.latitude === "number" && typeof body.longitude === "number"
      ? `${body.latitude.toFixed(2)}, ${body.longitude.toFixed(2)}`
      : undefined;
  const utc = body.timezone?.utc ? `UTC${body.timezone.utc}` : undefined;

  const candidates: [Localized, string | undefined, Localized?][] = [
    [
      { tr: "IP", en: "IP" },
      body.ip,
      own ? { tr: "Senin adresin", en: "Your address" } : undefined,
    ],
    [{ tr: "Sürüm", en: "Version" }, body.type],
    [{ tr: "Ülke", en: "Country" }, join(body.country, body.country_code)],
    [{ tr: "Bölge", en: "Region" }, body.region],
    [{ tr: "Şehir", en: "City" }, body.city],
    [{ tr: "Koordinat ≈", en: "Coordinates ≈" }, coordinates],
    [{ tr: "Saat dilimi", en: "Time zone" }, join(body.timezone?.id, utc)],
    [
      { tr: "ASN", en: "ASN" },
      body.connection?.asn ? `AS${body.connection.asn}` : undefined,
    ],
    [{ tr: "Kuruluş", en: "Organisation" }, body.connection?.org],
    [{ tr: "Servis sağlayıcı", en: "ISP" }, body.connection?.isp],
  ];

  const rows: ResultRow[] = candidates
    .filter((row): row is [Localized, string, Localized?] => Boolean(row[1]))
    .map(([label, value, hint]) =>
      hint ? { label, value, hint } : { label, value },
    );

  const labels = rows.map((row) => (row.label as Localized)[locale]);
  const width = Math.max(0, ...labels.map((label) => label.length));
  const text = rows
    .map((row, i) => `${labels[i].padEnd(width)}  ${row.value}`)
    .join("\n");

  return { text, rows };
}

/** City and country code, for the badge beside the result. */
export function placeOf(output: string): string | null {
  const field = (pattern: RegExp) => pattern.exec(output)?.[1]?.trim();
  const city = field(/^(?:Şehir|City)\s{2,}(.+)$/m);
  const country = field(/^(?:Ülke|Country)\s{2,}.*\((\w{2})\)$/m);
  const place = [city, country].filter(Boolean).join(", ");
  return place || null;
}

function join(a?: string, b?: string): string | undefined {
  if (!a) return b;
  return b ? `${a} (${b})` : a;
}

export async function lookupIp(
  input: string,
  locale: Locale,
): Promise<TextResult> {
  const ip = parseIp(input);
  if (ip) {
    const range = localRange(ip);
    if (range) {
      throw new ToolError({
        tr: `${ip.address} ${range.tr}; internette konumu yoktur.`,
        en: `${ip.address} is ${range.en}; it has no location on the internet.`,
      });
    }
  }

  let response: Response;
  try {
    response = await fetch(`https://ipwho.is/${ip?.address ?? ""}`);
  } catch {
    throw new ToolError({
      tr: "Sorgu gönderilemedi. Bağlantını kontrol et.",
      en: "Could not send the query. Check your connection.",
    });
  }

  if (response.status === 429) throw LIMITED;
  if (!response.ok) throw UNAVAILABLE;

  let body: Result;
  try {
    body = (await response.json()) as Result;
  } catch {
    throw UNAVAILABLE;
  }
  return formatResult(body, locale, ip === null);
}
