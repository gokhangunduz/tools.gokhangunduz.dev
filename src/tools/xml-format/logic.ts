import { ToolError } from "../text-tool";

/**
 * XML indent and minify, through a real parser.
 *
 * Indenting XML with a regex is the usual shortcut and it corrupts anything
 * with mixed content or a CDATA block. `fast-xml-parser` round-trips through
 * a tree, which also means malformed input is reported rather than silently
 * reformatted into something different.
 */
async function parser(preserveOrder: boolean) {
  const { XMLParser, XMLBuilder } = await import("fast-xml-parser");
  const shared = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder,
    // Keeps `<a>1</a>` a string rather than the number 1, which would drop a
    // leading zero from a value that was never a number.
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    cdataPropName: "#cdata",
  };
  return {
    parse: new XMLParser(shared),
    build: (indent: boolean) =>
      new XMLBuilder({
        ...shared,
        format: indent,
        indentBy: "  ",
        suppressEmptyNode: true,
      }),
  };
}

async function transform(input: string, indent: boolean): Promise<string> {
  if (!input.trim()) return "";

  // Validated first, because the parser is deliberately forgiving: it accepts
  // `<a><b></a>` and quietly closes the tag for you, which is the opposite of
  // what someone checking a file wants to hear.
  const { XMLValidator } = await import("fast-xml-parser");
  const verdict = XMLValidator.validate(input, {
    allowBooleanAttributes: true,
  });
  if (verdict !== true) {
    const { line, col, msg } = verdict.err;
    throw new ToolError({
      tr: `XML geçersiz (satır ${line}, sütun ${col}): ${msg}`,
      en: `Invalid XML (line ${line}, column ${col}): ${msg}`,
    });
  }

  const { parse, build } = await parser(true);
  const tree: unknown = parse.parse(input);

  if (!Array.isArray(tree) || tree.length === 0) {
    throw new ToolError({
      tr: "XML ayrıştırılamadı: kök öğe bulunamadı.",
      en: "Could not parse the XML: no root element.",
    });
  }

  const output: string = build(indent).build(tree);
  return indent ? output.trimEnd() : output.replace(/>\s+</g, "><").trim();
}

export function formatXml(input: string): Promise<string> {
  return transform(input, true);
}

export function minifyXml(input: string): Promise<string> {
  return transform(input, false);
}
