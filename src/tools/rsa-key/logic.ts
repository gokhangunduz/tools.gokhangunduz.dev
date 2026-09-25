import { ToolError } from "../text-tool";

/**
 * An RSA or EC key pair, generated in the browser and never sent anywhere.
 *
 * Generating a key here is safe in a way that *pasting* one is not: the
 * private key exists only in this tab, and the page has nowhere to send it.
 * It is still a key for testing — a production key belongs in whatever will
 * hold it, generated there.
 */
export type Algorithm = "RSA-2048" | "RSA-4096" | "EC-P256" | "EC-P384";

export async function generateKeyPair(algorithm: Algorithm): Promise<string> {
  const params: RsaHashedKeyGenParams | EcKeyGenParams = algorithm.startsWith(
    "RSA",
  )
    ? {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: algorithm === "RSA-4096" ? 4096 : 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      }
    : {
        name: "ECDSA",
        namedCurve: algorithm === "EC-P384" ? "P-384" : "P-256",
      };

  let pair: CryptoKeyPair;
  try {
    pair = (await crypto.subtle.generateKey(params, true, [
      "sign",
      "verify",
    ])) as CryptoKeyPair;
  } catch (cause) {
    throw new ToolError({
      tr: `Anahtar üretilemedi: ${cause instanceof Error ? cause.message : ""}`,
      en: `Could not generate the key: ${cause instanceof Error ? cause.message : ""}`,
    });
  }

  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("spki", pair.publicKey),
    crypto.subtle.exportKey("pkcs8", pair.privateKey),
  ]);

  return [
    toPem(publicKey, "PUBLIC KEY"),
    "",
    toPem(privateKey, "PRIVATE KEY"),
  ].join("\n");
}

/** DER bytes in base64, wrapped at 64 characters, as PEM requires. */
function toPem(buffer: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = btoa(binary);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return [`-----BEGIN ${label}-----`, ...lines, `-----END ${label}-----`].join(
    "\n",
  );
}
