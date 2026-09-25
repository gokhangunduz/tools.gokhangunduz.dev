import { parseJson } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * JSON and YAML, both directions.
 *
 * `JSON_SCHEMA` on the way in: YAML's default schema turns `no`, `off`, `y`
 * and `22:30` into booleans, strings and sexagesimal numbers, which is the
 * Norway problem and the single most common way a config file means something
 * other than what it says. Reading with the JSON schema means a value comes
 * out as what it looks like.
 */
export async function yamlToJson(
  input: string,
  indent: number,
): Promise<string> {
  if (!input.trim()) return "";

  const yaml = await import("js-yaml");
  let value: unknown;
  try {
    value = yaml.load(input, { schema: yaml.JSON_SCHEMA });
  } catch (cause) {
    throw new ToolError({
      tr: `YAML ayrıştırılamadı: ${firstLine(cause)}`,
      en: `Could not parse the YAML: ${firstLine(cause)}`,
    });
  }

  return JSON.stringify(value, null, indent);
}

export async function jsonToYaml(
  input: string,
  indent: number,
): Promise<string> {
  if (!input.trim()) return "";

  const value = parseJson(input);
  const yaml = await import("js-yaml");
  return yaml.dump(value, {
    indent,
    // Long strings are left on one line: a URL or a token wrapped across lines
    // is valid YAML and unusable when copied back out by eye.
    lineWidth: -1,
    noRefs: true,
  });
}

function firstLine(cause: unknown): string {
  return cause instanceof Error ? cause.message.split("\n")[0] : "";
}
