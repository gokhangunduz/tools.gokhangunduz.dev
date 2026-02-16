import { ToolError } from "../text-tool";

/**
 * Unix permissions, in both notations.
 *
 * Reads `755`, `rwxr-xr-x`, `drwxr-xr-x` (as `ls -l` prints it) or a symbolic
 * change like `u+x`, and prints the other forms plus what each digit means.
 */
export function describeMode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const mode = readMode(trimmed);
  const octal = mode.toString(8).padStart(3, "0");
  const symbolic = toSymbolic(mode);

  const rows: [string, string][] = [
    ["octal", octal],
    ["symbolic", symbolic],
    ["chmod", `chmod ${octal} dosya`],
    ["", ""],
    ["user / sahip", explain((mode >> 6) & 7)],
    ["group / grup", explain((mode >> 3) & 7)],
    ["other / diğer", explain(mode & 7)],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, value]) => (label ? `${label.padEnd(width)}  ${value}` : ""))
    .join("\n");
}

export function readMode(input: string): number {
  const trimmed = input.trim();

  if (/^[0-7]{3,4}$/.test(trimmed)) {
    return parseInt(trimmed, 8) & 0o777;
  }

  // `ls -l` prints a leading file-type character.
  const symbolic = trimmed.length === 10 ? trimmed.slice(1) : trimmed;
  if (/^[rwx-]{9}$/.test(symbolic)) {
    let mode = 0;
    for (const [index, character] of [...symbolic].entries()) {
      if (character === "-") continue;
      const expected = "rwx"[index % 3];
      if (character !== expected) {
        throw new ToolError({
          tr: `Sembolik gösterimde ${index + 1}. karakter "${expected}" ya da "-" olmalı.`,
          en: `Character ${index + 1} of the symbolic form must be "${expected}" or "-".`,
        });
      }
      mode |= 1 << (8 - index);
    }
    return mode;
  }

  throw new ToolError({
    tr: 'Anlaşılmadı. "755" ya da "rwxr-xr-x" bekleniyor.',
    en: 'Could not read it. Try "755" or "rwxr-xr-x".',
  });
}

function toSymbolic(mode: number): string {
  let output = "";
  for (let shift = 6; shift >= 0; shift -= 3) {
    const bits = (mode >> shift) & 7;
    output += bits & 4 ? "r" : "-";
    output += bits & 2 ? "w" : "-";
    output += bits & 1 ? "x" : "-";
  }
  return output;
}

function explain(bits: number): string {
  const parts = [
    bits & 4 ? "read" : null,
    bits & 2 ? "write" : null,
    bits & 1 ? "execute" : null,
  ].filter(Boolean);
  return `${bits}  ${parts.length > 0 ? parts.join(" + ") : "none"}`;
}
