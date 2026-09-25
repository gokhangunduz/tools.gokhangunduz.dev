import { ToolError } from "../text-tool";

/**
 * A curl command to the equivalent fetch call.
 *
 * The parser is deliberately small but it handles what people actually paste:
 * the "Copy as cURL" output of browser devtools, which is one long line of
 * `-H` flags with single-quoted values, line continuations, and a `--data-raw`
 * body. Anything it does not recognise is reported rather than dropped, so the
 * output is never quietly missing a header.
 */
export type Style = "fetch" | "axios";

type Request = {
  method: string;
  url: string;
  headers: [string, string][];
  body: string | null;
};

export function parseCurl(input: string): Request {
  const tokens = tokenize(input.replace(/\\\r?\n/g, " "));
  if (tokens.length === 0 || !/^curl$/i.test(tokens[0])) {
    throw new ToolError({
      tr: "Komut curl ile başlamalı.",
      en: "The command must start with curl.",
    });
  }

  const request: Request = { method: "", url: "", headers: [], body: null };

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    const next = () => {
      const value = tokens[i + 1];
      if (value === undefined) {
        throw new ToolError({
          tr: `${token} bir değer bekliyor.`,
          en: `${token} expects a value.`,
        });
      }
      i += 1;
      return value;
    };

    if (token === "-X" || token === "--request") {
      request.method = next().toUpperCase();
    } else if (token === "-H" || token === "--header") {
      const header = next();
      const at = header.indexOf(":");
      if (at === -1) {
        throw new ToolError({
          tr: `Başlık "ad: değer" biçiminde olmalı: ${header}`,
          en: `A header must read "name: value": ${header}`,
        });
      }
      request.headers.push([
        header.slice(0, at).trim(),
        header.slice(at + 1).trim(),
      ]);
    } else if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary"
    ) {
      request.body = next();
    } else if (token === "-u" || token === "--user") {
      const [user, ...rest] = next().split(":");
      request.headers.push([
        "Authorization",
        `Basic ${btoa(`${user}:${rest.join(":")}`)}`,
      ]);
    } else if (
      token === "--compressed" ||
      token === "-s" ||
      token === "--silent" ||
      token === "-L" ||
      token === "--location" ||
      token === "-k" ||
      token === "--insecure" ||
      token === "-i" ||
      token === "--include"
    ) {
      // Flags with no equivalent in fetch: they affect curl's own behaviour,
      // not the request, so dropping them changes nothing.
    } else if (token.startsWith("-")) {
      throw new ToolError({
        tr: `Bilinmeyen seçenek: ${token}`,
        en: `Unrecognised option: ${token}`,
      });
    } else if (!request.url) {
      request.url = token;
    }
  }

  if (!request.url) {
    throw new ToolError({ tr: "URL bulunamadı.", en: "No URL found." });
  }
  if (!request.method) request.method = request.body ? "POST" : "GET";

  return request;
}

/** Splits on whitespace, respecting single and double quotes. */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let started = false;

  for (let i = 0; i < input.length; i += 1) {
    const character = input[i];

    if (quote) {
      if (character === quote) {
        quote = null;
      } else if (character === "\\" && quote === '"' && i + 1 < input.length) {
        current += input[(i += 1)];
      } else {
        current += character;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      started = true;
      continue;
    }

    if (/\s/.test(character)) {
      if (current || started) tokens.push(current);
      current = "";
      started = false;
      continue;
    }

    current += character;
    started = true;
  }

  if (current || started) tokens.push(current);
  return tokens.filter((token, index) => token !== "" || index === 0);
}

export function toCode(input: string, style: Style): string {
  if (!input.trim()) return "";
  const request = parseCurl(input);

  return style === "axios" ? printAxios(request) : printFetch(request);
}

function printFetch(request: Request): string {
  const lines = [`const response = await fetch(${quote(request.url)}, {`];
  lines.push(`  method: ${quote(request.method)},`);

  if (request.headers.length > 0) {
    lines.push("  headers: {");
    for (const [name, value] of request.headers) {
      lines.push(`    ${quote(name)}: ${quote(value)},`);
    }
    lines.push("  },");
  }

  if (request.body !== null) {
    lines.push(`  body: ${body(request)},`);
  }

  lines.push("});");
  lines.push("");
  lines.push("const data = await response.json();");
  return lines.join("\n");
}

function printAxios(request: Request): string {
  const lines = [
    `import axios from "axios";`,
    "",
    "const { data } = await axios({",
  ];
  lines.push(`  method: ${quote(request.method.toLowerCase())},`);
  lines.push(`  url: ${quote(request.url)},`);

  if (request.headers.length > 0) {
    lines.push("  headers: {");
    for (const [name, value] of request.headers) {
      lines.push(`    ${quote(name)}: ${quote(value)},`);
    }
    lines.push("  },");
  }

  if (request.body !== null) {
    lines.push(`  data: ${body(request)},`);
  }

  lines.push("});");
  return lines.join("\n");
}

/**
 * A JSON body is printed as an object literal rather than a string.
 *
 * That is the shape the code would have been written in, and for axios it is
 * also the shape that works — passing a pre-serialized string there means the
 * content type is guessed wrong.
 */
function body(request: Request): string {
  const raw = request.body ?? "";
  const json = request.headers.some(
    ([name, value]) =>
      name.toLowerCase() === "content-type" && value.includes("json"),
  );
  if (!json) return quote(raw);

  try {
    return JSON.stringify(JSON.parse(raw), null, 2).split("\n").join("\n  ");
  } catch {
    return quote(raw);
  }
}

function quote(value: string): string {
  return JSON.stringify(value);
}
