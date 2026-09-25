import { ToolError } from "../text-tool";

/**
 * Bitwise arithmetic on 32-bit values, shown in binary.
 *
 * The output is the binary of both operands and the result, aligned, because
 * the reason to open this is to see which bit moved — a decimal answer alone
 * is what the calculator already gave.
 */
export type Operation = "and" | "or" | "xor" | "not" | "shl" | "shr" | "ushr";

export function compute(input: string, operation: Operation): string {
  const parts = input
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

  if (parts.length === 0) return "";

  const needsTwo = operation !== "not";
  if (needsTwo && parts.length < 2) {
    throw new ToolError({
      tr: "İki değer gerekli: aralarında boşluk bırak.",
      en: "Two values are needed: separate them with a space.",
    });
  }

  const a = readNumber(parts[0]);
  const b = needsTwo ? readNumber(parts[1]) : 0;

  const result =
    operation === "and"
      ? a & b
      : operation === "or"
        ? a | b
        : operation === "xor"
          ? a ^ b
          : operation === "not"
            ? ~a
            : operation === "shl"
              ? a << b
              : operation === "shr"
                ? a >> b
                : a >>> b;

  const symbol = {
    and: "&",
    or: "|",
    xor: "^",
    not: "~",
    shl: "<<",
    shr: ">>",
    ushr: ">>>",
  }[operation];

  const lines = [
    row("a", a),
    ...(needsTwo ? [row(`${symbol} b`, b)] : []),
    "".padEnd(48, "─"),
    row("=", result),
    "",
    `${result} (0x${(result >>> 0).toString(16)})`,
  ];

  if (!needsTwo) lines.splice(1, 0, `${symbol} (${operation})`);
  return lines.join("\n");
}

function row(label: string, value: number): string {
  return `${label.padEnd(5)} ${group(value)}  ${String(value).padStart(12)}`;
}

/** Four-bit groups, the way a register is read. */
function group(value: number): string {
  return (
    (value >>> 0).toString(2).padStart(32, "0").match(/.{4}/g) ?? []
  ).join(" ");
}

function readNumber(token: string): number {
  const cleaned = token.replace(/[_\s]/g, "");
  const parsed = /^0x/i.test(cleaned)
    ? parseInt(cleaned.slice(2), 16)
    : /^0b/i.test(cleaned)
      ? parseInt(cleaned.slice(2), 2)
      : Number(cleaned);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new ToolError({
      tr: `"${token}" bir tam sayı değil.`,
      en: `"${token}" is not an integer.`,
    });
  }
  if (parsed > 0xffff_ffff || parsed < -0x8000_0000) {
    throw new ToolError({
      tr: "Değer 32 bite sığmıyor; JavaScript'in bit işlemleri 32 bitliktir.",
      en: "The value does not fit in 32 bits, which is what these operators use.",
    });
  }
  return parsed | 0;
}
