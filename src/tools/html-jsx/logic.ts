import { ToolError } from "../text-tool";

/**
 * HTML pasted from a template or a design export, turned into JSX.
 *
 * The work is the attributes: `class` and `for` are reserved words, most of
 * the rest are camelCased, `style` becomes an object, and boolean attributes
 * need an explicit value. Void elements have to be closed, and comments have
 * to be wrapped in an expression or React renders them as text.
 *
 * Done on the token level with a small scanner rather than a DOM, so it works
 * on a fragment, keeps the original formatting, and runs the same in a test as
 * in the browser.
 */
const RENAMED: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  minlength: "minLength",
  colspan: "colSpan",
  rowspan: "rowSpan",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  enctype: "encType",
  novalidate: "noValidate",
  spellcheck: "spellCheck",
  contenteditable: "contentEditable",
  crossorigin: "crossOrigin",
  datetime: "dateTime",
  srcset: "srcSet",
  usemap: "useMap",
  accesskey: "accessKey",
  "http-equiv": "httpEquiv",
  charset: "charSet",
};

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const BOOLEAN_ATTRIBUTES = new Set([
  "checked",
  "disabled",
  "readonly",
  "required",
  "selected",
  "multiple",
  "autofocus",
  "autoplay",
  "controls",
  "loop",
  "muted",
  "open",
  "hidden",
  "novalidate",
  "default",
  "reversed",
  "async",
  "defer",
]);

export function htmlToJsx(input: string): string {
  if (!input.trim()) return "";
  if (!input.includes("<")) {
    throw new ToolError({
      tr: "Girdide HTML etiketi yok.",
      en: "There is no HTML tag in the input.",
    });
  }

  let output = input.replace(/<!--([\s\S]*?)-->/g, (_, body: string) => {
    return `{/*${body}*/}`;
  });

  output = output.replace(
    /<([a-zA-Z][\w:-]*)((?:\s+[^<>]*?)?)(\/?)>/g,
    (_, tag: string, attributes: string, selfClosing: string) => {
      const converted = convertAttributes(attributes);
      const close =
        selfClosing || VOID_ELEMENTS.has(tag.toLowerCase()) ? " />" : ">";
      return `<${tag}${converted}${close}`;
    },
  );

  return output.trim();
}

function convertAttributes(source: string): string {
  const pattern = /([a-zA-Z_:][\w:.-]*)(\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
  let result = "";
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const rawName = match[1];
    const lower = rawName.toLowerCase();
    const rawValue = match[3];
    const value =
      rawValue === undefined ? undefined : rawValue.replace(/^["']|["']$/g, "");

    // data-* and aria-* keep their hyphens in JSX; everything else camelCases.
    const name =
      lower.startsWith("data-") || lower.startsWith("aria-")
        ? lower
        : (RENAMED[lower] ?? camel(lower));

    if (value === undefined) {
      result += BOOLEAN_ATTRIBUTES.has(lower) ? ` ${name}` : ` ${name}=""`;
      continue;
    }

    if (name === "style") {
      result += ` style={{${styleObject(value)}}}`;
      continue;
    }

    result += ` ${name}="${value}"`;
  }

  return result;
}

function camel(name: string): string {
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function styleObject(value: string): string {
  const entries = value
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const at = declaration.indexOf(":");
      if (at === -1) return null;
      const property = camel(declaration.slice(0, at).trim());
      const setting = declaration.slice(at + 1).trim();
      return `${property}: ${JSON.stringify(setting)}`;
    })
    .filter((entry): entry is string => entry !== null);

  return entries.length > 0 ? ` ${entries.join(", ")} ` : "";
}
