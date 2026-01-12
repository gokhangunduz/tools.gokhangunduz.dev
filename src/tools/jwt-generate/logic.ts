import { ToolError } from "../text-tool";

/**
 * Signs a token from a payload, for testing an endpoint that expects one.
 *
 * HS256/384/512 only, with a shared secret. RSA signing would mean asking for
 * a private key, and a private key is exactly what should not be pasted into a
 * web page — even one that never sends it anywhere. Verification, where only
 * the public key is needed, lives in the decoder.
 */
export const ALGORITHMS = ["HS256", "HS384", "HS512"] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export async function signToken(
  payloadJson: string,
  secret: string,
  algorithm: Algorithm,
  expiresIn: string,
): Promise<string> {
  if (!payloadJson.trim()) return "";

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(payloadJson);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    throw new ToolError({
      tr: "Veri bölümü bir JSON nesnesi olmalı.",
      en: "The payload must be a JSON object.",
    });
  }

  if (!secret) {
    throw new ToolError({
      tr: "İmzalamak için bir gizli anahtar gerekli.",
      en: "Signing needs a secret.",
    });
  }
  // HS256 keys shorter than the digest are accepted by the spec but are the
  // most common reason a token is forgeable in practice.
  if (secret.length < 32) {
    throw new ToolError({
      tr: "Gizli anahtar en az 32 karakter olmalı (HS256 için güvenli alt sınır).",
      en: "The secret should be at least 32 characters (the safe floor for HS256).",
    });
  }

  const { SignJWT } = await import("jose");
  let builder = new SignJWT(payload)
    .setProtectedHeader({ alg: algorithm, typ: "JWT" })
    .setIssuedAt();

  if (expiresIn.trim()) {
    try {
      builder = builder.setExpirationTime(expiresIn.trim());
    } catch {
      throw new ToolError({
        tr: 'Süre anlaşılmadı. "2h", "30m", "7d" gibi yazılmalı.',
        en: 'Could not read the lifetime. Write it like "2h", "30m", "7d".',
      });
    }
  }

  return builder.sign(new TextEncoder().encode(secret));
}
