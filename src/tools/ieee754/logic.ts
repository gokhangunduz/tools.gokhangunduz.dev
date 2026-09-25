import { ToolError } from "../text-tool";

/**
 * What a floating-point number actually is.
 *
 * The tool exists for the moment someone asks why 0.1 + 0.2 is not 0.3, or why
 * a value read back from a binary format is 3.1400001049041748 — so it prints
 * the exact decimal value of the stored bits alongside the sign, exponent and
 * mantissa.
 */
export type Precision = "single" | "double";

export function describeFloat(input: string, precision: Precision): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const single = precision === "single";
  const value = readValue(trimmed, single);

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  if (single) view.setFloat32(0, value);
  else view.setFloat64(0, value);

  const stored = single ? view.getFloat32(0) : view.getFloat64(0);
  const bits = single
    ? view.getUint32(0).toString(2).padStart(32, "0")
    : (view.getBigUint64(0) as bigint).toString(2).padStart(64, "0");

  const exponentBits = single ? 8 : 11;
  const sign = bits[0];
  const exponent = bits.slice(1, 1 + exponentBits);
  const mantissa = bits.slice(1 + exponentBits);
  const bias = single ? 127 : 1023;
  const rawExponent = parseInt(exponent, 2);

  const rows: [string, string][] = [
    [
      "hex",
      `0x${single ? view.getUint32(0).toString(16).padStart(8, "0") : view.getBigUint64(0).toString(16).padStart(16, "0")}`,
    ],
    ["bits", `${sign} ${exponent} ${mantissa}`],
    ["sign", `${sign} (${sign === "0" ? "+" : "-"})`],
    [
      "exponent",
      rawExponent === 0
        ? `${rawExponent} (subnormal)`
        : rawExponent === (1 << exponentBits) - 1
          ? `${rawExponent} (Inf / NaN)`
          : `${rawExponent} - ${bias} = ${rawExponent - bias}`,
    ],
    ["mantissa", `0x${BigInt(`0b${mantissa}`).toString(16)}`],
    ["stored value", exact(stored)],
    ["error", exact(stored - value)],
  ];

  const width = Math.max(...rows.map(([label]) => label.length));
  return rows
    .map(([label, text]) => `${label.padEnd(width)}  ${text}`)
    .join("\n");
}

function readValue(input: string, single: boolean): number {
  // A hex pattern means the bits are being given directly, which is the other
  // half of this tool: reading a value out of a hexdump.
  if (/^0x[0-9a-f]+$/i.test(input)) {
    const hex = input.slice(2);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    if (single) {
      view.setUint32(0, Number(BigInt(`0x${hex}`) & 0xffff_ffffn));
      return view.getFloat32(0);
    }
    view.setBigUint64(0, BigInt(`0x${hex}`));
    return view.getFloat64(0);
  }

  const value = Number(input);
  if (Number.isNaN(value) && !/^nan$/i.test(input)) {
    throw new ToolError({
      tr: "Sayı ya da 0x ile başlayan bit deseni bekleniyor.",
      en: "A number, or a bit pattern starting with 0x, is expected.",
    });
  }
  return value;
}

/** Prints the full decimal expansion rather than the shortest round-trip. */
function exact(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Number.isInteger(value) && Math.abs(value) < 1e21)
    return value.toFixed(0);
  return value.toFixed(20).replace(/0+$/, "");
}
