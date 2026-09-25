import { ToolError } from "../text-tool";

/**
 * The six digits an authenticator app would be showing right now.
 *
 * Useful for two things: checking that a secret you are about to store
 * actually produces the codes the app expects, and getting into an account
 * while setting one up. The secret is base32 as every provider prints it.
 */
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function decodeBase32(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
  if (!cleaned) {
    throw new ToolError({
      tr: "Gizli anahtar boş.",
      en: "The secret is empty.",
    });
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of cleaned) {
    const index = BASE32.indexOf(character);
    if (index === -1) {
      throw new ToolError({
        tr: `"${character}" base32 alfabesinde yok.`,
        en: `"${character}" is not in the base32 alphabet.`,
      });
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

export type Options = {
  digits: number;
  period: number;
  algorithm: "SHA-1" | "SHA-256" | "SHA-512";
};

export async function totp(
  secret: string,
  options: Options,
  at: number = Date.now(),
): Promise<string> {
  const counter = Math.floor(at / 1000 / options.period);
  return hotp(secret, counter, options);
}

export async function hotp(
  secret: string,
  counter: number,
  options: Options,
): Promise<string> {
  const keyBytes = decodeBase32(secret);

  const message = new Uint8Array(8);
  let remaining = BigInt(counter);
  for (let i = 7; i >= 0; i -= 1) {
    message[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "HMAC", hash: options.algorithm },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, message as BufferSource),
  );

  // Dynamic truncation, RFC 4226 §5.3.
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);

  return String(binary % 10 ** options.digits).padStart(options.digits, "0");
}

/** How long the current code is still valid. */
export function secondsRemaining(
  period: number,
  at: number = Date.now(),
): number {
  return period - (Math.floor(at / 1000) % period);
}
