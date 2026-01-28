import { parseJson } from "@/lib/json";
import { ToolError } from "../text-tool";

/**
 * JSON and TOML, both directions.
 *
 * TOML has no null. A JSON document with one cannot be represented, and
 * writing an empty string instead would be a lie the user only discovers when
 * their config behaves differently — so the key is named and refused.
 */
export async function tomlToJson(
  input: string,
  indent: number,
): Promise<string> {
  if (!input.trim()) return "";

  const { parse } = await import("smol-toml");
  let value: unknown;
  try {
    value = parse(input);
  } catch (cause) {
    throw new ToolError({
      tr: `TOML ayrıştırılamadı: ${firstLine(cause)}`,
      en: `Could not parse the TOML: ${firstLine(cause)}`,
    });
  }
  return JSON.stringify(value, null, indent);
}

export async function jsonToToml(input: string): Promise<string> {
  if (!input.trim()) return "";

  const value = parseJson(input);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ToolError({
      tr: "TOML belgesinin kökü bir nesne olmalı.",
      en: "A TOML document's root must be an object.",
    });
  }

  const nullPath = findNull(value, []);
  if (nullPath) {
    throw new ToolError({
      tr: `TOML'de null yok: "${nullPath}" anahtarını kaldır ya da bir değer ver.`,
      en: `TOML has no null: remove "${nullPath}" or give it a value.`,
    });
  }

  const { stringify } = await import("smol-toml");
  try {
    return stringify(value);
  } catch (cause) {
    throw new ToolError({
      tr: `TOML'e çevrilemedi: ${firstLine(cause)}`,
      en: `Could not write TOML: ${firstLine(cause)}`,
    });
  }
}

/** Returns the dotted path of the first null, so the message can name it. */
function findNull(value: unknown, path: string[]): string | null {
  if (value === null) return path.join(".") || "(kök / root)";
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findNull(item, [...path, String(index)]);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      const found = findNull(item, [...path, key]);
      if (found) return found;
    }
  }
  return null;
}

function firstLine(cause: unknown): string {
  return cause instanceof Error ? cause.message.split("\n")[0] : "";
}
