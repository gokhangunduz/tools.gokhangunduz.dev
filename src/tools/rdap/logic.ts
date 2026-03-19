import { ToolError } from "../text-tool";

/**
 * WHOIS, as RDAP — the protocol that replaced it.
 *
 * rdap.org redirects to whichever registry is authoritative, and the
 * registries answer with permissive CORS, so this runs from the browser. Not
 * every ccTLD has an RDAP server, and the ones that do not are reported as
 * such rather than pretending the domain does not exist.
 */
type Entity = {
  roles?: string[];
  vcardArray?: unknown[];
};

type Event = { eventAction?: string; eventDate?: string };

type Rdap = {
  ldhName?: string;
  handle?: string;
  status?: string[];
  events?: Event[];
  entities?: Entity[];
  nameservers?: { ldhName?: string }[];
};

export function formatRdap(body: Rdap, locale: string): string {
  const rows: [string, string][] = [];

  if (body.ldhName)
    rows.push([locale === "tr" ? "alan adı" : "domain", body.ldhName]);
  if (body.handle) rows.push(["id", body.handle]);
  if (body.status?.length) rows.push(["status", body.status.join(", ")]);

  for (const event of body.events ?? []) {
    if (event.eventAction && event.eventDate) {
      rows.push([
        event.eventAction,
        event.eventDate.replace("T", " ").replace("Z", " UTC"),
      ]);
    }
  }

  const registrar = (body.entities ?? []).find((entity) =>
    entity.roles?.includes("registrar"),
  );
  const name = registrar ? vcardName(registrar) : null;
  if (name) rows.push(["registrar", name]);

  const nameservers = (body.nameservers ?? [])
    .map((server) => server.ldhName)
    .filter((value): value is string => Boolean(value));

  const width = Math.max(...rows.map(([label]) => label.length), 10);
  const lines = rows.map(
    ([label, value]) => `${label.padEnd(width)}  ${value}`,
  );

  if (nameservers.length > 0) {
    lines.push("", locale === "tr" ? "ad sunucuları:" : "nameservers:");
    lines.push(...nameservers.map((server) => `  ${server.toLowerCase()}`));
  }

  return lines.join("\n");
}

/** The registrar's name lives inside a jCard, which is an array of arrays. */
function vcardName(entity: Entity): string | null {
  const card = entity.vcardArray?.[1];
  if (!Array.isArray(card)) return null;
  for (const entry of card) {
    if (
      Array.isArray(entry) &&
      entry[0] === "fn" &&
      typeof entry[3] === "string"
    ) {
      return entry[3];
    }
  }
  return null;
}

export async function lookupDomain(
  input: string,
  locale: string,
): Promise<string> {
  const domain = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!domain) return "";

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    throw new ToolError({
      tr: "Alan adı geçersiz görünüyor.",
      en: "That does not look like a domain name.",
    });
  }

  let response: Response;
  try {
    response = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { accept: "application/rdap+json" },
    });
  } catch {
    throw new ToolError({
      tr: "Sorgu gönderilemedi. Bu uzantının RDAP sunucusu CORS'a kapalı olabilir.",
      en: "Could not send the query. This TLD's RDAP server may not allow browser requests.",
    });
  }

  if (response.status === 404) {
    throw new ToolError({
      tr: "Kayıt bulunamadı — alan adı boşta olabilir ya da bu uzantı RDAP sunmuyor.",
      en: "No record found — the domain may be unregistered, or the TLD may not offer RDAP.",
    });
  }
  if (!response.ok) {
    throw new ToolError({
      tr: `Sunucu ${response.status} döndü.`,
      en: `The server answered ${response.status}.`,
    });
  }

  return formatRdap((await response.json()) as Rdap, locale);
}
