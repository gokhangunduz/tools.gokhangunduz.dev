/**
 * Raw HTML inside Markdown, rebuilt from an allowlist rather than filtered:
 * every tag that comes out is one written here, with attribute values
 * re-escaped, so nothing the input smuggles in (an `onerror`, a
 * `javascript:` link, a `<script>`) can reach the page.
 */
const TAGS = new Set([
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "code",
  "dd",
  "del",
  "details",
  "div",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "var",
]);

const VOID = new Set(["br", "hr", "img"]);

const DROP_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "template",
  "noscript",
  "textarea",
  "title",
  "xmp",
  "noembed",
  "noframes",
  "select",
  "svg",
  "math",
]);

const ATTRIBUTES: Record<string, string[]> = {
  "*": ["title"],
  a: ["href"],
  img: ["src", "alt", "width", "height", "align"],
  details: ["open"],
  div: ["align"],
  p: ["align"],
  h1: ["align"],
  h2: ["align"],
  h3: ["align"],
  h4: ["align"],
  h5: ["align"],
  h6: ["align"],
  td: ["align", "colspan", "rowspan"],
  th: ["align", "colspan", "rowspan"],
  ol: ["start", "type"],
};

const TOKEN =
  /<!--[\s\S]*?(?:-->|$)|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const ATTRIBUTE =
  /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const ENTITY = /&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i;

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Text between tags: entities stay entities, anything tag-like is shown as text. */
function escapeText(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === "<") out += "&lt;";
    else if (c === ">") out += "&gt;";
    else if (c === "&") {
      const match = ENTITY.exec(value.slice(i, i + 40));
      out += match && match.index === 0 ? "&" : "&amp;";
    } else out += c;
  }
  return out;
}

function decodeEntities(value: string): string {
  return value.replace(
    /&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi,
    (whole, body: string) => {
      if (body[0] === "#") {
        const code =
          body[1] === "x" || body[1] === "X"
            ? parseInt(body.slice(2), 16)
            : parseInt(body.slice(1), 10);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
      }
      return NAMED[body.toLowerCase()] ?? whole;
    },
  );
}

/** A URL a link or image may point at: http(s), mailto for links, or relative. */
export function safeUrl(url: string, kind: "link" | "image"): string | null {
  const probe = url.replace(/[\u0000- \u007f]/g, "").toLowerCase();
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(probe);
  if (!scheme) return url.trim();
  if (scheme[1] === "http" || scheme[1] === "https") return url.trim();
  if (kind === "link" && scheme[1] === "mailto") return url.trim();
  if (
    kind === "image" &&
    /^data:image\/(png|gif|jpe?g|webp|avif);/.test(probe)
  ) {
    return url.trim();
  }
  return null;
}

const LINK_TARGET = ' target="_blank" rel="noopener noreferrer"';

function rebuildTag(close: string, rawName: string, rawAttributes: string) {
  const name = rawName.toLowerCase();
  if (close) return VOID.has(name) ? "" : `</${name}>`;

  const allowed = new Set([
    ...(ATTRIBUTES["*"] ?? []),
    ...(ATTRIBUTES[name] ?? []),
  ]);
  const kept: string[] = [];
  ATTRIBUTE.lastIndex = 0;
  for (let match; (match = ATTRIBUTE.exec(rawAttributes));) {
    const attribute = match[1].toLowerCase();
    if (!allowed.has(attribute)) continue;
    let value = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
    if (attribute === "href" || attribute === "src") {
      const safe = safeUrl(value, attribute === "href" ? "link" : "image");
      if (safe === null) continue;
      value = safe;
    }
    kept.push(
      match[2] === undefined && match[3] === undefined && match[4] === undefined
        ? ` ${attribute}`
        : ` ${attribute}="${escapeHtml(value)}"`,
    );
  }
  return `<${name}${kept.join("")}${name === "a" ? LINK_TARGET : ""}>`;
}

export function sanitizeHtml(html: string): string {
  let out = "";
  let at = 0;
  TOKEN.lastIndex = 0;
  for (let match; (match = TOKEN.exec(html));) {
    out += escapeText(html.slice(at, match.index));
    at = TOKEN.lastIndex;
    if (match[0].startsWith("<!--")) continue;
    const [, close, rawName, rawAttributes] = match;
    const name = rawName.toLowerCase();
    if (DROP_CONTENT.has(name)) {
      if (!close) {
        const end = new RegExp(`</${name}\\s*>`, "ig");
        end.lastIndex = at;
        const found = end.exec(html);
        at = found ? end.lastIndex : html.length;
        TOKEN.lastIndex = at;
      }
      continue;
    }
    if (!TAGS.has(name)) continue;
    out += rebuildTag(close, rawName, rawAttributes);
  }
  return out + escapeText(html.slice(at));
}

/** Markdown to HTML that is safe to put into this page. */
export async function renderMarkdown(input: string): Promise<string> {
  if (!input.trim()) return "";
  const { Marked } = await import("marked");
  const marked = new Marked({
    gfm: true,
    renderer: {
      html({ text }) {
        return sanitizeHtml(text);
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const safe = safeUrl(href, "link");
        if (safe === null) return text;
        const titled = title ? ` title="${escapeHtml(title)}"` : "";
        return `<a href="${escapeHtml(safe)}"${titled}${LINK_TARGET}>${text}</a>`;
      },
      image({ href, title, text }) {
        const safe = safeUrl(href, "image");
        if (safe === null) return escapeHtml(text);
        const titled = title ? ` title="${escapeHtml(title)}"` : "";
        return `<img src="${escapeHtml(safe)}" alt="${escapeHtml(text)}"${titled}>`;
      },
    },
  });
  return marked.parse(input, { async: true });
}

export type Edit = { text: string; start: number; end: number };

/** Tab indents every selected line by two spaces; Shift+Tab takes up to two away. */
export function indentLines(
  text: string,
  start: number,
  end: number,
  outdent: boolean,
): Edit {
  if (!outdent && start === end) {
    return {
      text: `${text.slice(0, start)}  ${text.slice(end)}`,
      start: start + 2,
      end: start + 2,
    };
  }
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const last = end > start && text[end - 1] === "\n" ? end - 1 : end;
  const lineEnd = text.indexOf("\n", last);
  const blockEnd = lineEnd === -1 ? text.length : lineEnd;
  const lines = text.slice(lineStart, blockEnd).split("\n");

  let first = 0;
  let total = 0;
  const changed = lines.map((line, index) => {
    if (outdent) {
      const remove = line.startsWith("  ")
        ? 2
        : line.startsWith(" ") || line.startsWith("\t")
          ? 1
          : 0;
      if (index === 0) first = -remove;
      total -= remove;
      return line.slice(remove);
    }
    if (index === 0) first = 2;
    total += 2;
    return `  ${line}`;
  });

  const next =
    text.slice(0, lineStart) + changed.join("\n") + text.slice(blockEnd);
  return {
    text: next,
    start: Math.max(lineStart, start + first),
    end: Math.max(lineStart, end + total),
  };
}

/** Cmd+B, Cmd+I and Cmd+K: wraps the selection, or unwraps it when already wrapped. */
export function wrapSelection(
  text: string,
  start: number,
  end: number,
  kind: "bold" | "italic" | "link",
  placeholder = "text",
): Edit {
  const selected = text.slice(start, end);
  if (kind === "link") {
    const label = selected || placeholder;
    const inserted = `[${label}](https://)`;
    const urlStart = start + label.length + 3;
    return {
      text: text.slice(0, start) + inserted + text.slice(end),
      start: selected ? urlStart : start + 1,
      end: selected ? urlStart + 8 : start + 1 + label.length,
    };
  }
  const mark = kind === "bold" ? "**" : "_";
  const before = text.slice(start - mark.length, start);
  const after = text.slice(end, end + mark.length);
  if (before === mark && after === mark) {
    return {
      text:
        text.slice(0, start - mark.length) +
        selected +
        text.slice(end + mark.length),
      start: start - mark.length,
      end: end - mark.length,
    };
  }
  return {
    text: text.slice(0, start) + mark + selected + mark + text.slice(end),
    start: start + mark.length,
    end: end + mark.length,
  };
}

export function countText(text: string): {
  words: number;
  chars: number;
  lines: number;
} {
  return {
    words: (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) ?? []).length,
    chars: [...text].length,
    lines: text === "" ? 0 : text.split("\n").length,
  };
}

/** The first heading, for a downloaded page's title. */
export function titleOf(markdown: string): string {
  const heading = /^#{1,6}\s+(.+?)\s*#*\s*$/m.exec(markdown);
  return heading ? heading[1].replace(/[*_`[\]]/g, "") : "Markdown";
}

export function htmlDocument(title: string, body: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body{max-width:46rem;margin:2rem auto;padding:0 1rem;font:16px/1.6 system-ui,sans-serif}
pre{overflow:auto;padding:.75rem;border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:6px}
code{font-family:ui-monospace,monospace}
table{border-collapse:collapse}th,td{border:1px solid color-mix(in srgb,currentColor 20%,transparent);padding:.3rem .6rem}
blockquote{margin-left:0;padding-left:1rem;border-left:2px solid color-mix(in srgb,currentColor 20%,transparent);opacity:.8}
img{max-width:100%}
</style>
</head>
<body>
${body}
</body>
</html>
`;
}
