import { ToolError } from "../text-tool";

/**
 * bcrypt, for the two things it is ever needed for outside a server: making a
 * hash to paste into a seed file, and checking whether a hash and a password
 * go together.
 *
 * The cost is deliberately exposed and defaults to 10. It is the only setting
 * that matters, and someone reading a hash out of a database is usually asking
 * exactly this question about it.
 */
export async function hashPassword(
  password: string,
  cost: number,
): Promise<string> {
  if (!password) return "";
  if (!Number.isInteger(cost) || cost < 4 || cost > 16) {
    throw new ToolError({
      tr: "Maliyet 4 ile 16 arasında olmalı.",
      en: "The cost must be between 4 and 16.",
    });
  }

  const { bcrypt } = await import("hash-wasm");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bcrypt({ password, salt, costFactor: cost });
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<string> {
  if (!password) return "";
  const trimmed = hash.trim();
  if (!trimmed) {
    throw new ToolError({
      tr: "Karşılaştırılacak hash girilmedi.",
      en: "No hash to compare against.",
    });
  }
  if (!/^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(trimmed)) {
    throw new ToolError({
      tr: "Bu bir bcrypt hash'ine benzemiyor ($2b$10$… bekleniyor).",
      en: "That does not look like a bcrypt hash ($2b$10$… expected).",
    });
  }

  const { bcryptVerify } = await import("hash-wasm");
  const ok = await bcryptVerify({ password, hash: trimmed });
  return ok ? "✓ eşleşiyor / matches" : "✗ eşleşmiyor / does not match";
}

/** The cost is in the hash itself, which is the part people forget. */
export function describeHash(hash: string): string | null {
  const match = /^\$2[aby]?\$(\d{2})\$/.exec(hash.trim());
  return match ? match[1].replace(/^0/, "") : null;
}
