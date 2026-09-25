import { ToolError } from "../text-tool";

/**
 * Reads a JWT, and optionally checks its signature.
 *
 * Decoding is deliberately separate from verifying: a token can be read
 * without any key, and pretending otherwise is why people paste production
 * tokens into sites that ask for the secret. The key field is empty by
 * default, and what it adds is a single line at the end.
 *
 * Timestamps are printed as dates because `1789432000` tells nobody whether
 * the token has expired, which is the question being asked.
 */
const TIME_CLAIMS = new Set(["exp", "iat", "nbf", "auth_time", "updated_at"]);

type Parts = { header: unknown; payload: unknown; raw: string[] };

function decodeSegment(segment: string, which: string): unknown {
  let json: string;
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const binary = atob(padded);
    json = new TextDecoder().decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
  } catch {
    throw new ToolError({
      tr: `Token'ın ${which} bölümü Base64url değil.`,
      en: `The token's ${which} is not Base64url.`,
    });
  }

  try {
    return JSON.parse(json);
  } catch {
    throw new ToolError({
      tr: `Token'ın ${which} bölümü JSON değil.`,
      en: `The token's ${which} is not JSON.`,
    });
  }
}

export function splitToken(input: string): Parts {
  const raw = input.trim().split(".");
  if (raw.length !== 3) {
    throw new ToolError({
      tr: "JWT üç bölümden oluşur: başlık.veri.imza",
      en: "A JWT has three parts: header.payload.signature",
    });
  }
  return {
    header: decodeSegment(raw[0], "header"),
    payload: decodeSegment(raw[1], "payload"),
    raw,
  };
}

/** Rewrites the epoch seconds in place, so the JSON stays the shape it had. */
function humanize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(humanize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (TIME_CLAIMS.has(key) && typeof item === "number") {
          return [key, `${item} (${new Date(item * 1000).toISOString()})`];
        }
        return [key, humanize(item)];
      }),
    );
  }
  return value;
}

export function decodeToken(input: string, dates: boolean): string {
  if (!input.trim()) return "";
  const { header, payload } = splitToken(input);

  const shown = dates
    ? { header: humanize(header), payload: humanize(payload) }
    : { header, payload };

  return JSON.stringify(shown, null, 2);
}

/** The line under the output: is this token usable right now? */
export function expiryNote(
  input: string,
): { expired: boolean; text: string } | null {
  let payload: unknown;
  try {
    payload = splitToken(input).payload;
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;

  const exp = (payload as Record<string, unknown>).exp;
  if (typeof exp !== "number") return null;

  const remaining = exp * 1000 - Date.now();
  return {
    expired: remaining <= 0,
    text: formatDuration(Math.abs(remaining)),
  };
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} dk / min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} sa / h`;
  return `${Math.floor(hours / 24)} gün / days`;
}

/**
 * Verifies with a shared secret or a public key.
 *
 * `jose` is imported lazily: verification is the minority case, and its key
 * parsing is most of the weight of this tool.
 */
export async function verifyToken(input: string, key: string): Promise<string> {
  const trimmed = key.trim();
  if (!trimmed) {
    throw new ToolError({
      tr: "Doğrulama için anahtar gerekli.",
      en: "Verification needs a key.",
    });
  }

  const jose = await import("jose");
  const { header } = splitToken(input);
  const algorithm =
    header && typeof header === "object"
      ? (header as Record<string, unknown>).alg
      : undefined;

  if (typeof algorithm !== "string" || algorithm === "none") {
    throw new ToolError({
      tr: "Token imzasız (alg: none) — doğrulanacak bir şey yok.",
      en: "The token is unsigned (alg: none) — there is nothing to verify.",
    });
  }

  try {
    const material = trimmed.includes("-----BEGIN")
      ? await jose.importSPKI(trimmed, algorithm)
      : new TextEncoder().encode(trimmed);
    await jose.jwtVerify(input.trim(), material, { algorithms: [algorithm] });
    return `✓ imza geçerli / signature valid (${algorithm})`;
  } catch (cause) {
    if (cause instanceof Error && cause.name === "JWTExpired") {
      return `✓ imza geçerli ama token süresi dolmuş / valid signature, expired token`;
    }
    throw new ToolError({
      tr: "İmza doğrulanamadı: anahtar yanlış ya da token değiştirilmiş.",
      en: "Signature did not verify: wrong key, or the token was altered.",
    });
  }
}
