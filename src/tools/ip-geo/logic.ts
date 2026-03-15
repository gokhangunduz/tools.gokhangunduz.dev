import { ToolError } from "../text-tool";

/**
 * Where an address is, roughly, and who announces it.
 *
 * ipwho.is answers with permissive CORS and needs no key. The accuracy of any
 * of these services is city-level at best and frequently wrong about VPN exit
 * nodes, so the output says what it is rather than implying a street address.
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

export function formatResult(body: Result, locale: string): string {
  if (body.success === false) {
    throw new ToolError({
      tr: `Sorgu başarısız: ${body.message ?? "bilinmeyen hata"}`,
      en: `Lookup failed: ${body.message ?? "unknown error"}`,
    });
  }

  const rows: [string, string | undefined][] = [
    ["ip", body.ip],
    ["type", body.type],
    [
      locale === "tr" ? "ülke" : "country",
      join(body.country, body.country_code),
    ],
    [locale === "tr" ? "bölge" : "region", body.region],
    [locale === "tr" ? "şehir" : "city", body.city],
    [
      locale === "tr" ? "konum" : "location",
      body.latitude !== undefined && body.longitude !== undefined
        ? `${body.latitude}, ${body.longitude}`
        : undefined,
    ],
    [
      locale === "tr" ? "saat dilimi" : "time zone",
      join(body.timezone?.id, body.timezone?.utc),
    ],
    ["asn", body.connection?.asn ? `AS${body.connection.asn}` : undefined],
    ["org", body.connection?.org],
    ["isp", body.connection?.isp],
  ];

  const present = rows.filter(
    (row): row is [string, string] => row[1] !== undefined && row[1] !== "",
  );
  const width = Math.max(...present.map(([label]) => label.length));

  return [
    ...present.map(([label, value]) => `${label.padEnd(width)}  ${value}`),
    "",
    locale === "tr"
      ? "Konum şehir düzeyinde bir tahmindir; VPN ve mobil ağlarda sık sık yanlıştır."
      : "The location is a city-level estimate, and is often wrong for VPNs and mobile networks.",
  ].join("\n");
}

function join(a?: string, b?: string): string | undefined {
  if (!a) return b;
  return b ? `${a} (${b})` : a;
}

export async function lookupIp(input: string, locale: string): Promise<string> {
  const address = input.trim();
  // Empty means "this browser's own address", which is the other half of what
  // the tool is for.
  const target = address === "" ? "" : address;

  if (target && !/^[0-9a-f:.]+$/i.test(target)) {
    throw new ToolError({
      tr: "IP adresi geçersiz görünüyor.",
      en: "That does not look like an IP address.",
    });
  }

  let response: Response;
  try {
    response = await fetch(`https://ipwho.is/${target}`);
  } catch {
    throw new ToolError({
      tr: "Sorgu gönderilemedi. Bağlantını kontrol et.",
      en: "Could not send the query. Check your connection.",
    });
  }

  if (!response.ok) {
    throw new ToolError({
      tr: `Servis ${response.status} döndü.`,
      en: `The service answered ${response.status}.`,
    });
  }

  return formatResult((await response.json()) as Result, locale);
}
