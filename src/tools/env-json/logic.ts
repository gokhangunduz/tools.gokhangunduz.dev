import { parseJsonObject } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * A .env file and a JSON object, both directions.
 *
 * The parsing rules are dotenv's, because that is what reads the file in
 * practice: `export` prefixes are ignored, `#` starts a comment outside
 * quotes, quoted values keep their spaces, and a double-quoted value has its
 * escapes expanded while a single-quoted one does not.
 */
export function envToJson(input: string, indent: number): string {
  if (!input.trim()) return "";

  const result: Record<string, string> = {};

  for (const [index, line] of input.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const withoutExport = trimmed.replace(/^export\s+/, "");
    const at = withoutExport.indexOf("=");
    if (at === -1) {
      throw new ToolError({
        tr: `Satır ${index + 1}: "=" yok.`,
        en: `Line ${index + 1}: no "=".`,
      });
    }

    const key = withoutExport.slice(0, at).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(key)) {
      throw new ToolError({
        tr: `Satır ${index + 1}: geçersiz değişken adı "${key}".`,
        en: `Line ${index + 1}: invalid variable name "${key}".`,
      });
    }

    result[key] = readValue(withoutExport.slice(at + 1).trim());
  }

  return JSON.stringify(result, null, indent);
}

function readValue(raw: string): string {
  if (raw.startsWith('"')) {
    const end = raw.lastIndexOf('"');
    const inner = end > 0 ? raw.slice(1, end) : raw.slice(1);
    return inner
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  if (raw.startsWith("'")) {
    const end = raw.lastIndexOf("'");
    return end > 0 ? raw.slice(1, end) : raw.slice(1);
  }
  // Unquoted: a # starts a comment, and trailing spaces are not part of it.
  return raw.split(" #")[0].trim();
}

export function jsonToEnv(input: string): string {
  if (!input.trim()) return "";

  const object = parseJsonObject(input);
  return Object.entries(object)
    .map(([key, value]) => {
      if (value !== null && typeof value === "object") {
        throw new ToolError({
          tr: `"${key}" bir nesne/dizi: .env yalnız düz değerler tutar.`,
          en: `"${key}" is an object or array: .env holds flat values only.`,
        });
      }
      return `${key}=${writeValue(value === null ? "" : String(value))}`;
    })
    .join("\n");
}

/** Quoted only when it has to be, so the file stays readable. */
function writeValue(value: string): string {
  if (value === "") return "";
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}
