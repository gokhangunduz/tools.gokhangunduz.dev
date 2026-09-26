import type { Locale, Localized } from "@/i18n";
import {
  ToolError,
  type ResultGroup,
  type ResultRow,
  type TextResult,
} from "../text-tool";
import { parseIp } from "../ip-geo/logic";

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
export type Query = RecordType | "ALL";

/** What "all" asks for: the types a domain usually has, in parallel. */
export const COMMON_TYPES: RecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "NS",
  "SOA",
  "CAA",
];

type Answer = { name: string; type: number; TTL: number; data: string };

export type DohResponse = {
  Status: number;
  Answer?: Answer[];
  Authority?: Answer[];
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

const RCODES: Record<number, [string, Localized]> = {
  1: [
    "FORMERR",
    {
      tr: "Resolver sorguyu anlayamadı.",
      en: "The resolver could not parse the query.",
    },
  ],
  2: [
    "SERVFAIL",
    {
      tr: "Alanın nameserver'ları yanıt veremedi; erişilemeyen bir sunucu ya da bozuk DNSSEC olabilir.",
      en: "The domain's nameservers could not answer; an unreachable server or broken DNSSEC is likely.",
    },
  ],
  3: [
    "NXDOMAIN",
    { tr: "Böyle bir alan adı yok.", en: "No such domain exists." },
  ],
  4: [
    "NOTIMP",
    {
      tr: "Resolver bu sorgu türünü desteklemiyor.",
      en: "The resolver does not support this kind of query.",
    },
  ],
  5: [
    "REFUSED",
    {
      tr: "Sunucu bu sorguyu yanıtlamayı reddetti.",
      en: "The server refused to answer this query.",
    },
  ],
};

export function buildUrl(name: string, type: RecordType): string {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);
  return url.toString();
}

export type Target = {
  /** The name sent to the resolver: punycode, or a reverse-lookup name. */
  name: string;
  /** What the person typed, reduced to a host. */
  typed: string;
  reverse: boolean;
};

/** The IP's in-addr.arpa or ip6.arpa name, or null when the text is not an IP. */
export function reverseName(text: string): string | null {
  let ip;
  try {
    ip = parseIp(text);
  } catch {
    return null;
  }
  if (!ip) return null;
  if (ip.version === 4)
    return `${[...ip.groups].reverse().join(".")}.in-addr.arpa`;
  const nibbles = ip.groups
    .map((group) => group.toString(16).padStart(4, "0"))
    .join("")
    .split("")
    .reverse();
  return `${nibbles.join(".")}.ip6.arpa`;
}

/**
 * A host from whatever was pasted: a URL loses its scheme, port, path and
 * query, an internationalised name becomes punycode, and an IP becomes the
 * name its PTR record lives under.
 */
export function parseTarget(input: string): Target | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const reverse = reverseName(trimmed);
  if (reverse) return { name: reverse, typed: trimmed, reverse: true };

  let host: string;
  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`,
    );
    host = url.hostname;
  } catch {
    throw invalidName();
  }

  const bracketed = /^\[(.*)\]$/.exec(host);
  if (bracketed) {
    const name = reverseName(bracketed[1]);
    if (name) return { name, typed: bracketed[1], reverse: true };
  }

  const name = host.replace(/\.$/, "");
  if (!name || !/^[a-z0-9._-]+$/i.test(name) || name.includes("..")) {
    throw invalidName();
  }

  const typed = trimmed
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/[/?#:].*$/, "")
    .replace(/\.$/, "")
    .toLowerCase();
  return { name, typed, reverse: false };
}

function invalidName() {
  return new ToolError({
    tr: "Alan adı, URL ya da IP adresi gibi görünmüyor.",
    en: "That does not look like a domain name, a URL or an IP address.",
  });
}

/** A note about what was actually asked, when it is not what was typed. */
export function targetNote(input: string): Localized | null {
  let target: Target | null;
  try {
    target = parseTarget(input);
  } catch {
    return null;
  }
  if (!target) return null;
  if (target.reverse) {
    return {
      tr: `${target.typed} bir IP; PTR kaydı ${target.name} adında soruldu.`,
      en: `${target.typed} is an IP; its PTR record was asked for under ${target.name}.`,
    };
  }
  if (target.name !== target.typed) {
    return {
      tr: `${target.typed} punycode olarak ${target.name} diye soruldu.`,
      en: `${target.typed} was asked for in punycode, as ${target.name}.`,
    };
  }
  return null;
}

export function formatTtl(seconds: number, locale: Locale): string {
  const tr = locale === "tr";
  const unit = (value: number, trUnit: string, enUnit: string) =>
    `${value} ${tr ? trUnit : enUnit}`;
  if (seconds < 60) return unit(seconds, "sn", "s");
  if (seconds < 3600) return unit(Math.floor(seconds / 60), "dk", "min");
  if (seconds < 86_400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes
      ? `${unit(hours, "sa", "h")} ${unit(minutes, "dk", "min")}`
      : unit(hours, "sa", "h");
  }
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  return hours
    ? `${unit(days, "gün", "d")} ${unit(hours, "sa", "h")}`
    : unit(days, "gün", "d");
}

const bare = (name: string) => name.replace(/\.$/, "").toLowerCase();
const typeName = (answer: Answer) =>
  TYPE_NAMES[answer.type] ?? `TYPE${answer.type}`;

function answerRow(answer: Answer, query: string): ResultRow {
  const type = typeName(answer);
  const ttl = {
    tr: formatTtl(answer.TTL, "tr"),
    en: formatTtl(answer.TTL, "en"),
  };
  const row: ResultRow = {
    label: { tr: `${type} · ${ttl.tr}`, en: `${type} · ${ttl.en}` },
    value: answer.data,
  };
  if (bare(answer.name) !== bare(query)) {
    row.hint = { tr: answer.name, en: answer.name };
  }
  return row;
}

function dig(answer: Answer): string {
  const name = answer.name.endsWith(".") ? answer.name : `${answer.name}.`;
  return `${name}\t${answer.TTL}\tIN\t${typeName(answer)}\t${answer.data}`;
}

const NO_RECORDS: Localized = { tr: "kayıt yok", en: "no records" };

function notice(label: string, text: Localized, locale: Locale): ResultRow {
  return { label, value: text[locale], tone: "muted", copy: false };
}

/** An rcode other than NOERROR, as a notice with nothing to copy. */
function rcodeResult(status: number, locale: Locale): TextResult {
  const [name, text] = RCODES[status] ?? [
    `RCODE ${status}`,
    {
      tr: "Resolver beklenmeyen bir yanıt kodu döndürdü.",
      en: "The resolver answered with an unexpected response code.",
    },
  ];
  return { text: "", rows: [notice(name, text, locale)] };
}

function authorityRow(body: DohResponse): ResultRow | null {
  const soa = body.Authority?.find((answer) => answer.type === 6);
  if (!soa) return null;
  return {
    label: { tr: "Yetkili", en: "Authority" },
    value: soa.data.split(/\s+/)[0],
    tone: "muted",
  };
}

export function formatResponse(
  body: DohResponse,
  type: RecordType,
  query: string,
  locale: Locale,
): TextResult {
  if (body.Status !== 0) return rcodeResult(body.Status, locale);
  const answers = body.Answer ?? [];
  if (answers.length === 0) {
    const authority = authorityRow(body);
    return {
      text: "",
      rows: [
        notice(type, NO_RECORDS, locale),
        ...(authority ? [authority] : []),
      ],
    };
  }
  return {
    text: answers.map(dig).join("\n"),
    rows: answers.map((answer) => answerRow(answer, query)),
  };
}

/** Several answers merged: grouped by record type, with the empty types said out loud. */
export function formatAll(
  bodies: DohResponse[],
  query: string,
  locale: Locale,
): TextResult {
  const failed = bodies.find((body) => body.Status !== 0);
  if (failed && bodies.every((body) => body.Status !== 0)) {
    return rcodeResult(failed.Status, locale);
  }
  if (bodies.some((body) => body.Status === 3)) return rcodeResult(3, locale);

  const seen = new Set<string>();
  const answers: Answer[] = [];
  for (const body of bodies) {
    for (const answer of body.Answer ?? []) {
      const key = `${bare(answer.name)} ${answer.type} ${answer.data}`;
      if (seen.has(key)) continue;
      seen.add(key);
      answers.push(answer);
    }
  }

  const order = [...COMMON_TYPES, ...RECORD_TYPES] as string[];
  const types = [...new Set([...COMMON_TYPES, ...answers.map(typeName)])].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  );

  const groups: ResultGroup[] = types.map((type) => {
    const matching = answers.filter((answer) => typeName(answer) === type);
    return {
      label: type,
      rows:
        matching.length > 0
          ? matching.map((answer) => answerRow(answer, query))
          : [notice(type, NO_RECORDS, locale)],
    };
  });

  const sorted = types.flatMap((type) =>
    answers.filter((answer) => typeName(answer) === type),
  );
  return { text: sorted.map(dig).join("\n"), groups };
}

async function ask(name: string, type: RecordType): Promise<DohResponse> {
  let response: Response;
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
      tr: "Resolver şu an yanıt vermiyor; biraz sonra yeniden dene.",
      en: "The resolver is not answering right now; try again in a while.",
    });
  }
  try {
    return (await response.json()) as DohResponse;
  } catch {
    throw new ToolError({
      tr: "Resolver'ın yanıtı okunamadı.",
      en: "The resolver's answer could not be read.",
    });
  }
}

export async function lookup(
  input: string,
  query: Query,
  locale: Locale,
): Promise<TextResult> {
  const target = parseTarget(input);
  if (!target) return { text: "" };

  if (target.reverse || query === "PTR") {
    return formatResponse(
      await ask(target.name, "PTR"),
      "PTR",
      target.name,
      locale,
    );
  }
  if (query === "ALL") {
    const bodies = await Promise.all(
      COMMON_TYPES.map((type) => ask(target.name, type)),
    );
    return formatAll(bodies, target.name, locale);
  }
  return formatResponse(
    await ask(target.name, query),
    query,
    target.name,
    locale,
  );
}

/** "3 records", from the dig-format text. */
export function recordCount(output: string): Localized | null {
  const count = output ? output.split("\n").length : 0;
  if (count === 0) return null;
  return {
    tr: `${count} kayıt`,
    en: `${count} ${count === 1 ? "record" : "records"}`,
  };
}
