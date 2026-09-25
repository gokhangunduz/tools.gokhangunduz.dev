import { ToolError } from "../text-tool";

/**
 * HMAC through WebCrypto.
 *
 * WebCrypto has every hash HMAC is used with in practice, so this needs no
 * wasm — and using the platform's own implementation is the right default for
 * anything that guards a webhook signature.
 */
export const HMAC_HASHES = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HmacHash = (typeof HMAC_HASHES)[number];
export type Output = "hex" | "base64";

export async function hmac(
  message: string,
  secret: string,
  hash: HmacHash,
  output: Output,
): Promise<string> {
  if (!message) return "";
  if (!secret) {
    throw new ToolError({
      tr: "Anahtar boş. HMAC bir gizli anahtar olmadan hesaplanamaz.",
      en: "The key is empty. HMAC needs a secret.",
    });
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(message)),
  );

  if (output === "base64") {
    return btoa(String.fromCharCode(...signature));
  }
  return Array.from(signature, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
