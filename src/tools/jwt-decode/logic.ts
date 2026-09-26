import type { Locale } from "@/i18n";
import { ToolError } from "../text-tool";

/**
 * Reads a JWT, and optionally checks its signature.
 *
 * Decoding is deliberately separate from verifying: a token can be read
 * without any key, and pretending otherwise is why people paste production
 * tokens into sites that ask for the secret. A failed verification never
 * hides what the token says.
 */
export const TIME_CLAIMS = ["exp", "iat", "nbf", "auth_time", "updated_at"];

export const SAMPLE_KEY = "demo-secret-demo-secret-demo-1234";
export const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkfDtmtoYW4gR8O8bmTDvHoiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkyNDk5MTk5OX0.6gNBKpFpaT3GWwYFe3BadlcR8oRfkX8BltnSZSm2tXs";

type Claims = Record<string, unknown>;

export type Decoded = {
  header: Claims;
  payload: Claims;
  segments: [string, string, string];
};

function decodeSegment(segment: string, which: string): Claims {
  let json: string;
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const binary = atob(padded);
    json = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
  } catch {
    throw new ToolError({
      tr: `Token'ın ${which} bölümü Base64url değil.`,
      en: `The token's ${which} is not Base64url.`,
    });
  }

  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new ToolError({
      tr: `Token'ın ${which} bölümü JSON değil.`,
      en: `The token's ${which} is not JSON.`,
    });
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ToolError({
      tr: `Token'ın ${which} bölümü bir JSON nesnesi değil.`,
      en: `The token's ${which} is not a JSON object.`,
    });
  }
  return value as Claims;
}

/** What people paste: `Bearer eyJ…`, a quoted string from a JSON body, a trailing newline. */
export function cleanToken(input: string): string {
  const unquote = (value: string) =>
    value
      .trim()
      .replace(/^(["'`])([\s\S]*)\1$/, "$2")
      .trim();
  return unquote(unquote(input).replace(/^bearer\s+/i, ""));
}

export function splitToken(input: string): Decoded {
  const segments = cleanToken(input).split(".");
  if (segments.length !== 3) {
    throw new ToolError({
      tr: "JWT üç bölümden oluşur: header.payload.signature",
      en: "A JWT has three parts: header.payload.signature",
    });
  }
  return {
    header: decodeSegment(segments[0], "header"),
    payload: decodeSegment(segments[1], "payload"),
    segments: segments as [string, string, string],
  };
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** The download: both halves as one JSON document, values untouched. */
export function decodedJson({ header, payload }: Decoded): string {
  return prettyJson({ header, payload });
}

export type TimeStatus =
  | { state: "valid"; ms: number }
  | { state: "expired"; ms: number }
  | { state: "notYet"; ms: number }
  | { state: "noExp" };

/** Is this token usable right now? `ms` is signed: until expiry, since expiry, until nbf. */
export function timeStatus(payload: Claims, now: number): TimeStatus {
  const { exp, nbf } = payload;
  if (typeof nbf === "number" && nbf * 1000 > now) {
    return { state: "notYet", ms: nbf * 1000 - now };
  }
  if (typeof exp !== "number") return { state: "noExp" };
  const ms = exp * 1000 - now;
  return ms > 0 ? { state: "valid", ms } : { state: "expired", ms };
}

/** "in 3 hours", "111 gün sonra", "2.203 gün önce" — the locale's own words. */
export function formatRelative(ms: number, locale: Locale): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  const abs = Math.abs(ms);
  const sign = ms < 0 ? -1 : 1;
  if (abs < 60_000) {
    return format.format(sign * Math.round(abs / 1000), "second");
  }
  if (abs < 3_600_000) {
    return format.format(sign * Math.round(abs / 60_000), "minute");
  }
  if (abs < 48 * 3_600_000) {
    return format.format(sign * Math.round(abs / 3_600_000), "hour");
  }
  return format.format(sign * Math.round(abs / 86_400_000), "day");
}

export function formatDate(seconds: number, locale: Locale): string {
  return new Date(seconds * 1000).toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** The note shown after a timestamp claim; it annotates, never replaces. */
export function timeAnnotation(
  key: string,
  value: unknown,
  locale: Locale,
  now: number,
): string | null {
  if (!TIME_CLAIMS.includes(key) || typeof value !== "number") return null;
  if (!Number.isFinite(value) || Math.abs(value) > 1e11) return null;
  return `${formatDate(value, locale)} · ${formatRelative(value * 1000 - now, locale)}`;
}

export type Verdict =
  | { status: "valid"; alg: string }
  | { status: "mismatch"; alg: string }
  | { status: "badKey"; alg: string }
  | { status: "unsigned" };

type KeyLike = Awaited<ReturnType<typeof import("jose").importSPKI>>;

async function readKey(
  jose: typeof import("jose"),
  key: string,
  alg: string,
  kid: unknown,
): Promise<KeyLike | Uint8Array> {
  if (key.startsWith("-----BEGIN CERTIFICATE-----")) {
    return jose.importX509(key, alg);
  }
  if (key.startsWith("-----BEGIN PUBLIC KEY-----")) {
    return jose.importSPKI(key, alg);
  }
  if (key.startsWith("-----")) throw new Error("unsupported PEM");
  if (key.startsWith("{")) {
    const parsed = JSON.parse(key) as { keys?: unknown };
    const jwk = Array.isArray(parsed.keys)
      ? ((parsed.keys as { kid?: unknown }[]).find((k) => k.kid === kid) ??
        parsed.keys[0])
      : parsed;
    return jose.importJWK(jwk as Parameters<typeof jose.importJWK>[0], alg);
  }
  if (!alg.startsWith("HS")) throw new Error("needs a public key");
  return new TextEncoder().encode(key);
}

/**
 * Checks the signature only. Expiry is shown on its own, so an expired token
 * with a good signature reads as exactly that.
 */
export async function verifyToken(
  input: string,
  key: string,
): Promise<Verdict> {
  const token = cleanToken(input);
  const { header } = splitToken(token);
  const alg = header.alg;
  if (typeof alg !== "string" || alg === "none") return { status: "unsigned" };

  const jose = await import("jose");
  let material: KeyLike | Uint8Array;
  try {
    material = await readKey(jose, key.trim(), alg, header.kid);
  } catch {
    return { status: "badKey", alg };
  }
  try {
    await jose.compactVerify(token, material, { algorithms: [alg] });
    return { status: "valid", alg };
  } catch (cause) {
    return cause instanceof jose.errors.JWSSignatureVerificationFailed
      ? { status: "mismatch", alg }
      : { status: "badKey", alg };
  }
}
