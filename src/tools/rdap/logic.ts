import type { Locale, Localized } from "@/i18n";
import {
  ToolError,
  type ResultGroup,
  type ResultRow,
  type TextResult,
  type Tone,
} from "../text-tool";

/**
 * WHOIS, as RDAP — the protocol that replaced it.
 *
 * rdap.org redirects to whichever registry is authoritative, and the
 * registries answer with permissive CORS, so this runs from the browser. A
 * 404 that never left rdap.org means the TLD has no RDAP server; a 404 from
 * the registry means the domain is not registered.
 */
type Vcard = unknown[];

export type Entity = {
  roles?: string[];
  vcardArray?: [string, Vcard[]] | unknown[];
  publicIds?: { type?: string; identifier?: string }[];
  entities?: Entity[];
};

type Event = { eventAction?: string; eventDate?: string };

export type Rdap = {
  ldhName?: string;
  unicodeName?: string;
  status?: string[];
  events?: Event[];
  entities?: Entity[];
  nameservers?: { ldhName?: string }[];
  secureDNS?: {
    delegationSigned?: boolean;
    dsData?: { keyTag?: number; algorithm?: number }[];
  };
};

const RDAP_BASE = "https://rdap.org/domain/";
const DAY = 86_400_000;

export type Target = { name: string; typed: string };

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/**
 * The registrable name from whatever was pasted: a URL loses its scheme,
 * path and port, a leading www. goes, and an internationalised name becomes
 * punycode. Throws before any request is made.
 */
export function parseDomain(input: string): Target | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let host: string;
  try {
    host = new URL(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`,
    ).hostname;
  } catch {
    throw notADomain();
  }

  if (host.startsWith("[") || IPV4.test(host)) {
    throw new ToolError({
      tr: "Bu araç IP adresi değil, alan adı sorgular. Örneğin example.com yaz.",
      en: "This looks up domain names, not IP addresses. Try something like example.com.",
    });
  }

  let name = host.replace(/\.$/, "").toLowerCase();
  const labels = name.split(".");
  if (labels.length < 2) {
    throw new ToolError({
      tr: "Alan adının bir TLD'si olmalı, örneğin example.com.",
      en: "A domain needs a TLD, as in example.com.",
    });
  }
  const tld = labels[labels.length - 1];
  if (
    name.length > 253 ||
    !labels.every((label) => LABEL.test(label)) ||
    !/^([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(tld)
  ) {
    throw notADomain();
  }
  if (labels.length > 2 && labels[0] === "www")
    name = labels.slice(1).join(".");

  const typed = trimmed
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/[/?#:].*$/, "")
    .replace(/\.$/, "")
    .toLowerCase();
  return { name, typed };
}

function notADomain() {
  return new ToolError({
    tr: "Bu bir alan adı gibi görünmüyor. Örneğin example.com yaz.",
    en: "That does not look like a domain name. Try something like example.com.",
  });
}

/** A note about what was actually asked, when it is not what was typed. */
export function queryNote(input: string): Localized | null {
  let target: Target | null;
  try {
    target = parseDomain(input);
  } catch {
    return null;
  }
  if (!target || target.name === target.typed) return null;
  return {
    tr: `${target.name} olarak soruldu.`,
    en: `Looked up as ${target.name}.`,
  };
}

/** "in 12 days", "3 years ago" — both languages, relative to `now`. */
export function relativeTime(date: Date, now: Date): Localized {
  const days = Math.round((date.getTime() - now.getTime()) / DAY);
  const size = Math.abs(days);
  if (size === 0) return { tr: "bugün", en: "today" };

  const [count, tr, en] =
    size < 60
      ? [size, "gün", "day"]
      : size < 730
        ? [Math.round(size / 30.44), "ay", "month"]
        : [Math.floor(size / 365.25), "yıl", "year"];
  const unit = `${en}${count === 1 ? "" : "s"}`;
  return days > 0
    ? { tr: `${count} ${tr} sonra`, en: `in ${count} ${unit}` }
    : { tr: `${count} ${tr} önce`, en: `${count} ${unit} ago` };
}

function vcardField(entity: Entity, field: string): string | null {
  const card = entity.vcardArray?.[1];
  if (!Array.isArray(card)) return null;
  for (const entry of card) {
    if (
      Array.isArray(entry) &&
      entry[0] === field &&
      typeof entry[3] === "string" &&
      entry[3].trim()
    ) {
      return entry[3].trim();
    }
  }
  return null;
}

function withRole(entities: Entity[] = [], role: string): Entity | undefined {
  return entities.find((entity) => entity.roles?.includes(role));
}

function eventDate(body: Rdap, action: string): Date | null {
  const raw = body.events?.find(
    (event) => event.eventAction === action,
  )?.eventDate;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function dateRow(
  label: Localized,
  date: Date | null,
  now: Date,
  tone?: Tone,
): ResultRow[] {
  if (!date) return [];
  return [{ label, value: isoDate(date), hint: relativeTime(date, now), tone }];
}

function expiryTone(date: Date | null, now: Date): Tone | undefined {
  if (!date) return undefined;
  const days = (date.getTime() - now.getTime()) / DAY;
  if (days < 0) return "destructive";
  if (days <= 30) return "warning";
  return undefined;
}

function statusTone(status: string[]): Tone | undefined {
  const all = status.join(" ").toLowerCase();
  if (/redemption|pending delete/.test(all)) return "destructive";
  if (/hold/.test(all)) return "warning";
  return undefined;
}

const LABELS = {
  domain: { tr: "Alan adı", en: "Domain" },
  status: { tr: "Durum", en: "Status" },
  created: { tr: "Kayıt tarihi", en: "Created" },
  updated: { tr: "Son güncelleme", en: "Updated" },
  expires: { tr: "Bitiş tarihi", en: "Expires" },
  registrar: { tr: "Registrar", en: "Registrar" },
  ianaId: { tr: "IANA ID", en: "IANA ID" },
  abuseEmail: { tr: "Abuse e-postası", en: "Abuse email" },
  abusePhone: { tr: "Abuse telefonu", en: "Abuse phone" },
  dns: { tr: "DNS", en: "DNS" },
  nameserver: { tr: "Nameserver", en: "Nameserver" },
  dnssec: { tr: "DNSSEC", en: "DNSSEC" },
} satisfies Record<string, Localized>;

export function formatRdap(
  body: Rdap,
  locale: Locale,
  now: Date = new Date(),
): TextResult {
  const status = body.status ?? [];
  const expires = eventDate(body, "expiration");
  const domainRows: ResultRow[] = [
    ...(body.ldhName
      ? [
          {
            label: LABELS.domain,
            value: body.ldhName.toLowerCase(),
            hint:
              body.unicodeName &&
              body.unicodeName.toLowerCase() !== body.ldhName.toLowerCase()
                ? { tr: body.unicodeName, en: body.unicodeName }
                : undefined,
          },
        ]
      : []),
    ...(status.length
      ? [
          {
            label: LABELS.status,
            value: status.join(", "),
            tone: statusTone(status),
          },
        ]
      : []),
    ...dateRow(LABELS.created, eventDate(body, "registration"), now),
    ...dateRow(LABELS.updated, eventDate(body, "last changed"), now),
    ...dateRow(LABELS.expires, expires, now, expiryTone(expires, now)),
  ];

  const registrar = withRole(body.entities, "registrar");
  const abuse =
    withRole(registrar?.entities, "abuse") ?? withRole(body.entities, "abuse");
  const registrarName = registrar ? vcardField(registrar, "fn") : null;
  const ianaId = registrar?.publicIds?.find((id) =>
    /iana/i.test(id.type ?? ""),
  )?.identifier;
  const abuseEmail = abuse ? vcardField(abuse, "email") : null;
  const abusePhone = abuse
    ? vcardField(abuse, "tel")?.replace(/^tel:/i, "")
    : null;
  const registrarRows: ResultRow[] = [
    ...(registrarName
      ? [{ label: LABELS.registrar, value: registrarName }]
      : []),
    ...(ianaId ? [{ label: LABELS.ianaId, value: ianaId }] : []),
    ...(abuseEmail ? [{ label: LABELS.abuseEmail, value: abuseEmail }] : []),
    ...(abusePhone ? [{ label: LABELS.abusePhone, value: abusePhone }] : []),
  ];

  const nameservers = (body.nameservers ?? [])
    .map((server) => server.ldhName?.toLowerCase().replace(/\.$/, ""))
    .filter((value): value is string => Boolean(value));
  const signed = body.secureDNS?.delegationSigned;
  const ds = body.secureDNS?.dsData?.[0];
  const dsHint =
    signed && ds?.keyTag !== undefined
      ? `DS ${ds.keyTag}${ds.algorithm !== undefined ? ` · alg ${ds.algorithm}` : ""}`
      : null;
  const dnsRows: ResultRow[] = [
    ...nameservers.map((value) => ({ label: LABELS.nameserver, value })),
    ...(signed === undefined
      ? []
      : [
          {
            label: LABELS.dnssec,
            value: signed
              ? { tr: "imzalı", en: "signed" }[locale]
              : { tr: "imzasız", en: "unsigned" }[locale],
            tone: signed ? ("success" as const) : ("muted" as const),
            hint: dsHint ? { tr: dsHint, en: dsHint } : undefined,
          },
        ]),
  ];

  const groups: ResultGroup[] = [
    { label: LABELS.domain, rows: domainRows },
    { label: LABELS.registrar, rows: registrarRows },
    { label: LABELS.dns, rows: dnsRows },
  ].filter((group) => group.rows.length > 0);

  return { text: plainText(groups, locale), groups };
}

function plainText(groups: ResultGroup[], locale: Locale): string {
  const name = (label: Localized | string) =>
    typeof label === "string" ? label : label[locale];
  const width = Math.max(
    ...groups.flatMap((group) =>
      group.rows.map((row) => name(row.label).length),
    ),
  );
  return groups
    .map((group) =>
      group.rows
        .map((row) => {
          const line = `${name(row.label).padEnd(width)}  ${row.value}`;
          return row.hint ? `${line}  (${row.hint[locale]})` : line;
        })
        .join("\n"),
    )
    .join("\n\n");
}

function failure(tr: string, en: string): ToolError {
  return new ToolError({ tr, en });
}

export async function lookupDomain(
  input: string,
  locale: Locale,
  now: Date = new Date(),
): Promise<TextResult> {
  const target = parseDomain(input);
  if (!target) return { text: "" };
  const { name } = target;

  let response: Response;
  try {
    response = await fetch(`${RDAP_BASE}${name}`, {
      headers: { accept: "application/rdap+json" },
    });
  } catch {
    throw failure(
      "Sorgu gönderilemedi. Bağlantını kontrol et; sorun sürerse bu TLD'nin RDAP sunucusu tarayıcıdan gelen isteklere kapalı olabilir.",
      "Could not send the query. Check your connection; if it keeps failing, this TLD's RDAP server may not accept requests from a browser.",
    );
  }

  if (response.status === 404) {
    const tld = name.slice(name.lastIndexOf(".") + 1);
    if (!response.redirected) {
      throw failure(
        `.${tld} için RDAP sunucusu yok. Bu TLD'nin kayıtları yalnız klasik WHOIS'ten okunabiliyor, o da tarayıcıdan sorgulanamıyor.`,
        `There is no RDAP server for .${tld}. Its records are only available over classic WHOIS, which a browser cannot query.`,
      );
    }
    const sub = name.split(".").length > 2;
    throw failure(
      `${name} için kayıt bulunamadı; alan adı alınmamış olabilir.${sub ? " Alt alan adı yerine kayıtlı alan adının kendisini yaz, örneğin example.com." : ""}`,
      `No registration found for ${name}; it may be available.${sub ? " Type the registered domain itself rather than a subdomain, e.g. example.com." : ""}`,
    );
  }
  if (response.status === 429) {
    throw failure(
      "Çok fazla sorgu gönderildi; RDAP sunucusu şimdilik yanıt vermiyor. Bir dakika bekleyip yeniden dene.",
      "Too many lookups; the RDAP server is holding off for now. Wait a minute and try again.",
    );
  }
  if (!response.ok) {
    throw failure(
      "RDAP sunucusu şu an yanıt vermiyor; biraz sonra yeniden dene.",
      "The RDAP server is not answering right now; try again in a while.",
    );
  }

  let body: Rdap;
  try {
    body = (await response.json()) as Rdap;
  } catch {
    throw failure(
      "RDAP sunucusunun yanıtı okunamadı.",
      "The RDAP server's answer could not be read.",
    );
  }
  return formatRdap(body, locale, now);
}
