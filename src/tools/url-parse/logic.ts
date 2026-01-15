import { ToolError } from "../text-tool";

/**
 * Takes a URL apart, including the query string.
 *
 * `new URL` is the parser — it is the same one the browser uses, so the answer
 * matches what a request would actually do rather than what a regex thinks.
 * Query values are printed decoded, because the reason to open this tool is
 * usually to read a value that is unreadable encoded.
 */
export function parseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ToolError({
      tr: "Geçerli bir URL değil. Şema eksik olabilir (https:// gibi).",
      en: "Not a valid URL. The scheme may be missing (https://, say).",
    });
  }

  const rows: [string, string][] = [
    ["scheme", url.protocol.replace(/:$/, "")],
    ["host", url.hostname],
    ["port", url.port || defaultPort(url.protocol)],
    ["path", url.pathname],
    ["fragment", url.hash.replace(/^#/, "")],
  ];

  if (url.username) rows.push(["user", url.username]);
  // Never printed back: a password in a URL is the one part of it that should
  // not end up in a screenshot or a paste.
  if (url.password) rows.push(["password", "•".repeat(8)]);

  const params = [...url.searchParams.entries()];
  const width = Math.max(
    ...rows.map(([key]) => key.length),
    ...params.map(([key]) => key.length),
    0,
  );

  const lines = rows
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key.padEnd(width)}  ${value}`);

  if (params.length > 0) {
    lines.push("", `query (${params.length})`);
    for (const [key, value] of params) {
      lines.push(`  ${key.padEnd(width)}  ${value}`);
    }
  }

  return lines.join("\n");
}

function defaultPort(protocol: string): string {
  if (protocol === "https:") return "443 (varsayılan / default)";
  if (protocol === "http:") return "80 (varsayılan / default)";
  return "";
}
