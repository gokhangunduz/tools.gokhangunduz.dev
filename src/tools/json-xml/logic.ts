import { parseJson } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * JSON and XML, both directions.
 *
 * Attributes come through as `@_name` keys and text as `#text`, which is the
 * convention `fast-xml-parser` uses and the one the JSON→XML direction reads
 * back — so a document that goes XML → JSON → XML survives its attributes
 * instead of having them flattened into elements.
 */
const SHARED = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
} as const;

export async function xmlToJson(
  input: string,
  indent: number,
): Promise<string> {
  if (!input.trim()) return "";

  const { XMLParser, XMLValidator } = await import("fast-xml-parser");
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

  const value: unknown = new XMLParser(SHARED).parse(input);
  return JSON.stringify(value, null, indent);
}

export async function jsonToXml(input: string): Promise<string> {
  if (!input.trim()) return "";

  const value = parseJson(input);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ToolError({
      tr: "XML belgesinin tek bir kök öğesi olmalı, yani girdi bir nesne olmalı.",
      en: "An XML document needs a single root element, so the input must be an object.",
    });
  }

  const keys = Object.keys(value);
  if (keys.length !== 1) {
    throw new ToolError({
      tr: `XML tek kök ister; girdide ${keys.length} üst düzey anahtar var.`,
      en: `XML allows one root; the input has ${keys.length} top-level keys.`,
    });
  }

  const { XMLBuilder } = await import("fast-xml-parser");
  return new XMLBuilder({
    ...SHARED,
    format: true,
    indentBy: "  ",
    suppressEmptyNode: true,
  })
    .build(value)
    .trimEnd();
}
