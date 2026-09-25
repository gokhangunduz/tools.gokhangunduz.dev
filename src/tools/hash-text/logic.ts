import { ToolError } from "../text-tool";

/**
 * The digests people actually paste into a form field.
 *
 * `hash-wasm` rather than WebCrypto: WebCrypto has no MD5 and no CRC32, and
 * those are most of why someone opens a hashing tool — checking a legacy
 * checksum. It is imported lazily inside each call so the wasm module is
 * fetched when this tool is used and never as part of the page.
 */
export const ALGORITHMS = [
  "md5",
  "sha1",
  "sha256",
  "sha384",
  "sha512",
  "sha3-256",
  "sha3-512",
  "crc32",
] as const;

export type Algorithm = (typeof ALGORITHMS)[number];

export async function hashText(
  input: string,
  algorithm: Algorithm,
  upper: boolean,
): Promise<string> {
  if (!input) return "";

  const wasm = await import("hash-wasm");
  const digest = await runDigest(wasm, input, algorithm);
  return upper ? digest.toUpperCase() : digest;
}

async function runDigest(
  wasm: typeof import("hash-wasm"),
  input: string,
  algorithm: Algorithm,
): Promise<string> {
  switch (algorithm) {
    case "md5":
      return wasm.md5(input);
    case "sha1":
      return wasm.sha1(input);
    case "sha256":
      return wasm.sha256(input);
    case "sha384":
      return wasm.sha384(input);
    case "sha512":
      return wasm.sha512(input);
    case "sha3-256":
      return wasm.sha3(input, 256);
    case "sha3-512":
      return wasm.sha3(input, 512);
    case "crc32":
      return wasm.crc32(input);
    default:
      throw new ToolError({
        tr: "Bilinmeyen algoritma.",
        en: "Unknown algorithm.",
      });
  }
}

/** Every algorithm at once, for identifying a digest of unknown origin. */
export async function hashAll(input: string, upper: boolean): Promise<string> {
  if (!input) return "";
  const width = Math.max(...ALGORITHMS.map((name) => name.length));
  const lines = await Promise.all(
    ALGORITHMS.map(async (name) => {
      const digest = await hashText(input, name, upper);
      return `${name.padEnd(width)}  ${digest}`;
    }),
  );
  return lines.join("\n");
}
