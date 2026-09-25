import { ToolError } from "../text-tool";

/**
 * A regular expression against a body of text, with what it matched.
 *
 * Every match is listed with its position and its capture groups, named ones
 * included — the part a "does it match" checkbox leaves out and the part you
 * are usually debugging.
 */
export type Mode = "matches" | "replace" | "split" | "highlight";

export function testRegex(
  input: string,
  pattern: string,
  flags: string,
  mode: Mode,
  replacement: string,
): string {
  if (!pattern) {
    throw new ToolError({
      tr: "Desen girilmedi.",
      en: "No pattern given.",
    });
  }
  if (!input) return "";

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  } catch (cause) {
    throw new ToolError({
      tr: `Desen geçersiz: ${cause instanceof Error ? cause.message : ""}`,
      en: `Invalid pattern: ${cause instanceof Error ? cause.message : ""}`,
    });
  }

  if (mode === "replace") {
    return input.replace(regex, replacement);
  }

  if (mode === "split") {
    return input.split(regex).join("\n");
  }

  const matches = [...input.matchAll(regex)];

  if (mode === "highlight") {
    let output = "";
    let last = 0;
    for (const match of matches) {
      const at = match.index ?? 0;
      output += input.slice(last, at) + `«${match[0]}»`;
      last = at + match[0].length;
      // A zero-length match would otherwise loop forever on the same index.
      if (match[0].length === 0) last += 1;
    }
    return output + input.slice(last);
  }

  if (matches.length === 0) {
    return "Eşleşme yok. / No match.";
  }

  return matches
    .map((match, index) => {
      const lines = [
        `#${index + 1}  @${match.index}  ${JSON.stringify(match[0])}`,
      ];
      for (let group = 1; group < match.length; group += 1) {
        lines.push(`      $${group}  ${JSON.stringify(match[group] ?? null)}`);
      }
      for (const [name, value] of Object.entries(match.groups ?? {})) {
        lines.push(`      ?<${name}>  ${JSON.stringify(value ?? null)}`);
      }
      return lines.join("\n");
    })
    .join("\n");
}

export function countMatches(
  input: string,
  pattern: string,
  flags: string,
): number {
  try {
    const regex = new RegExp(
      pattern,
      flags.includes("g") ? flags : `${flags}g`,
    );
    return [...input.matchAll(regex)].length;
  } catch {
    return 0;
  }
}
