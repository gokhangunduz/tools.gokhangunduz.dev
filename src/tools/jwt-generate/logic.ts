import { parseJson } from "@/lib/json";
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

/** RFC 7518 §3.2: a key at least as long as the hash output. */
export const MIN_SECRET_BYTES: Record<Algorithm, number> = {
  HS256: 32,
  HS384: 48,
  HS512: 64,
};

export const LIFETIMES = ["15m", "1h", "1d", "7d", "none", "expired"] as const;
export type Lifetime = (typeof LIFETIMES)[number];

const LIFETIME_SECONDS: Record<Lifetime, number | null> = {
  "15m": 900,
  "1h": 3600,
  "1d": 86_400,
  "7d": 604_800,
  none: null,
  expired: -3600,
};

export type Claims = Record<string, unknown>;

export function parsePayload(input: string): Claims {
  const value = parseJson(input);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ToolError({
      tr: "Payload bir JSON object olmalı.",
      en: "The payload must be a JSON object.",
    });
  }
  return value as Claims;
}

function base64Bytes(value: string): Uint8Array | null {
  const clean = value
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/=+$/, "");
  if (!clean || !/^[A-Za-z0-9+/]*$/.test(clean) || clean.length % 4 === 1) {
    return null;
  }
  try {
    const binary = atob(clean.padEnd(Math.ceil(clean.length / 4) * 4, "="));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

export function secretBytes(secret: string, base64: boolean): Uint8Array {
  if (!secret) {
    throw new ToolError(
      {
        tr: "Sign etmek için bir secret gerekli.",
        en: "Signing needs a secret.",
      },
      { field: "secret" },
    );
  }
  if (!base64) return new TextEncoder().encode(secret);
  const bytes = base64Bytes(secret);
  if (!bytes) {
    throw new ToolError(
      {
        tr: "Secret geçerli base64 değil.",
        en: "The secret is not valid base64.",
      },
      { field: "secret" },
    );
  }
  return bytes;
}

/** The byte count the length warning is about, or null when the secret cannot be read. */
export function secretLength(secret: string, base64: boolean): number | null {
  try {
    return secretBytes(secret, base64).length;
  } catch {
    return null;
  }
}

export function randomSecret(bytes: number, base64: boolean): string {
  const random = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const byte of random) binary += String.fromCharCode(byte);
  const encoded = btoa(binary);
  return base64
    ? encoded
    : encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** When the token would expire, in epoch seconds, or null for no exp. */
export function expiryFor(lifetime: Lifetime, now: number): number | null {
  const seconds = LIFETIME_SECONDS[lifetime];
  return seconds === null ? null : Math.floor(now / 1000) + seconds;
}

export type Signed = {
  token: string;
  header: { alg: Algorithm; typ: "JWT" };
  claims: Claims;
  shortSecret: { bytes: number; min: number } | null;
  expOverridden: boolean;
};

/**
 * A payload's own iat and exp win: someone who wrote them meant them. A
 * short secret still signs, with a warning, because a test token signed with
 * the server's actual short secret is the point.
 */
export async function signToken({
  payload,
  secret,
  secretBase64,
  algorithm,
  lifetime,
  now,
}: {
  payload: string;
  secret: string;
  secretBase64: boolean;
  algorithm: Algorithm;
  lifetime: Lifetime;
  now: number;
}): Promise<Signed> {
  const claims: Claims = { ...parsePayload(payload) };
  const key = secretBytes(secret, secretBase64);

  if (!("iat" in claims)) claims.iat = Math.floor(now / 1000);
  const expOverridden = "exp" in claims && lifetime !== "none";
  if (!("exp" in claims)) {
    const exp = expiryFor(lifetime, now);
    if (exp !== null) claims.exp = exp;
  }

  const header = { alg: algorithm, typ: "JWT" } as const;
  const { SignJWT } = await import("jose");
  const token = await new SignJWT(claims).setProtectedHeader(header).sign(key);
  const min = MIN_SECRET_BYTES[algorithm];

  return {
    token,
    header,
    claims,
    shortSecret: key.length < min ? { bytes: key.length, min } : null,
    expOverridden,
  };
}
