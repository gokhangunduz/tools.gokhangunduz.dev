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

export const ALGORITHM_NAMES: Record<Algorithm, string> = {
  md5: "MD5",
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
  "sha3-256": "SHA3-256",
  "sha3-512": "SHA3-512",
  crc32: "CRC32",
};

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

export type Digest = { algorithm: Algorithm; name: string; value: string };

/** Every algorithm at once, for identifying a digest of unknown origin. */
export async function hashAll(
  input: string,
  upper: boolean,
): Promise<Digest[]> {
  if (!input) return [];
  return Promise.all(
    ALGORITHMS.map(async (algorithm) => ({
      algorithm,
      name: ALGORITHM_NAMES[algorithm],
      value: await hashText(input, algorithm, upper),
    })),
  );
}

/** The digests as plain text, one `NAME  value` line each. */
export function formatDigests(digests: Digest[]): string {
  const width = Math.max(0, ...digests.map((d) => d.name.length));
  return digests.map((d) => `${d.name.padEnd(width)}  ${d.value}`).join("\n");
}

/** Which algorithm produced `expected`, ignoring case and surrounding space. */
export function findMatch(
  digests: Digest[],
  expected: string,
): Algorithm | null {
  const wanted = expected.trim().toLowerCase();
  if (!wanted) return null;
  return (
    digests.find((d) => d.value.toLowerCase() === wanted)?.algorithm ?? null
  );
}

export function utf8Length(input: string): number {
  return new TextEncoder().encode(input).length;
}

/** An editor's final newline is part of the bytes, and the usual reason a digest does not match. */
export function hasTrailingNewline(input: string): boolean {
  return /\r?\n$/.test(input);
}

export function stripTrailingNewlines(input: string): string {
  return input.replace(/(\r?\n)+$/, "");
}
