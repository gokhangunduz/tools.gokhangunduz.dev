import { ToolError } from "../text-tool";

/**
 * A number in every base at once.
 *
 * BigInt throughout: a 64-bit hash or an ID from a database is past what a
 * double can hold exactly, and printing 9007199254740993 as ...92 is the kind
 * of wrong answer nobody checks.
 */
export type Base = 2 | 8 | 10 | 16 | 36;

export function parseNumber(input: string, base: Base | "auto"): bigint {
  const trimmed = input.trim().replace(/[\s_]/g, "");
  if (!trimmed) throw new ToolError({ tr: "Boş.", en: "Empty." });

  const negative = trimmed.startsWith("-");
  const body = negative ? trimmed.slice(1) : trimmed;

  const detected = base === "auto" ? detect(body) : base;
  const digits = base === "auto" ? strip(body) : body;

  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, detected);
  let value = 0n;
  for (const character of digits.toLowerCase()) {
    const digit = alphabet.indexOf(character);
    if (digit === -1) {
      throw new ToolError({
        tr: `"${character}" ${detected} tabanında bir basamak değil.`,
        en: `"${character}" is not a digit in base ${detected}.`,
      });
    }
    value = value * BigInt(detected) + BigInt(digit);
  }

  return negative ? -value : value;
}

function detect(body: string): Base {
  if (/^0x/i.test(body)) return 16;
  if (/^0b/i.test(body)) return 2;
  if (/^0o/i.test(body)) return 8;
  return 10;
}

function strip(body: string): string {
  return body.replace(/^0[xbo]/i, "");
}

export function describeNumber(input: string, base: Base | "auto"): string {
  const value = parseNumber(input, base);
  const magnitude = value < 0n ? -value : value;

  const rows: [string, string][] = [
    ["10 (decimal)", value.toString(10)],
    ["16 (hex)", sign(value, magnitude.toString(16))],
    ["8 (octal)", sign(value, magnitude.toString(8))],
    ["2 (binary)", sign(value, magnitude.toString(2))],
    ["36", sign(value, magnitude.toString(36))],
    ["bit", String(magnitude.toString(2).length)],
  ];

  // The unsigned two's-complement reading, which is what a register holds.
  if (value < 0n && magnitude <= 0xffff_ffffn) {
    rows.push(["uint32", ((1n << 32n) + value).toString(10)]);
  }

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, text]) => `${label.padEnd(width)}  ${text}`)
    .join("\n");
}

function sign(value: bigint, digits: string): string {
  return value < 0n ? `-${digits}` : digits;
}
