import { ToolError } from "../text-tool";

/**
 * DNS over HTTPS, straight from the browser.
 *
 * Cloudflare's resolver answers with `Access-Control-Allow-Origin: *`, so this
 * needs no proxy of our own — which is what keeps the site's promise intact:
 * the query goes from the visitor's browser to a public resolver, and nothing
 * passes through anything of ours.
 */
export const RECORD_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "CAA",
  "SRV",
  "PTR",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

type Answer = { name: string; type: number; TTL: number; data: string };

type Response = {
  Status: number;
  Answer?: Answer[];
  Authority?: Answer[];
  Comment?: string;
};

const TYPE_NAMES: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  12: "PTR",
  15: "MX",
  16: "TXT",
  28: "AAAA",
  33: "SRV",
  257: "CAA",
};

export function buildUrl(name: string, type: RecordType): string {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);
  return url.toString();
}

export function formatResponse(body: Response, locale: string): string {
  if (body.Status === 3) {
    return locale === "tr"
      ? "NXDOMAIN — böyle bir alan adı yok."
      : "NXDOMAIN — no such domain.";
  }
  if (body.Status !== 0) {
    return `Status ${body.Status}${body.Comment ? ` — ${body.Comment}` : ""}`;
  }

  const answers = body.Answer ?? [];
  if (answers.length === 0) {
    const authority = body.Authority?.[0];
    return locale === "tr"
      ? `Kayıt yok.${authority ? ` Yetkili: ${authority.data}` : ""}`
      : `No records.${authority ? ` Authority: ${authority.data}` : ""}`;
  }

  const width = Math.max(...answers.map((answer) => answer.name.length));
  return answers
    .map(
      (answer) =>
        `${answer.name.padEnd(width)}  ${String(answer.TTL).padStart(6)}  ${
          TYPE_NAMES[answer.type] ?? answer.type
        }  ${answer.data}`,
    )
    .join("\n");
}

export async function lookup(
  input: string,
  type: RecordType,
  locale: string,
): Promise<string> {
  const name = input
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!name) return "";

  if (!/^[a-z0-9._-]+$/i.test(name)) {
    throw new ToolError({
      tr: "Alan adı geçersiz görünüyor.",
      en: "That does not look like a domain name.",
    });
  }

  let response: globalThis.Response;
  try {
    response = await fetch(buildUrl(name, type), {
      headers: { accept: "application/dns-json" },
    });
  } catch {
    throw new ToolError({
      tr: "Sorgu gönderilemedi. Bağlantını kontrol et.",
      en: "Could not send the query. Check your connection.",
    });
  }

  if (!response.ok) {
    throw new ToolError({
      tr: `Çözümleyici ${response.status} döndü.`,
      en: `The resolver answered ${response.status}.`,
    });
  }

  return formatResponse((await response.json()) as Response, locale);
}
