import { ToolError } from "../text-tool";

/**
 * The identifier formats worth having, and the reason to pick between them.
 *
 * v4 is random and sorts arbitrarily; v7 carries a millisecond timestamp in
 * its first 48 bits, so a table keyed on it stays in insertion order and the
 * index does not fragment. ULID is the same idea in a shorter, case-insensitive
 * alphabet. Nano ID is not a UUID at all — it is a short random string for
 * URLs, which is what people actually want half the time they reach for one.
 */
export type Kind = "v4" | "v7" | "ulid" | "nanoid";

export function generateIds(kind: Kind, count: number, upper: boolean): string {
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    throw new ToolError({
      tr: "Adet 1 ile 1000 arasında olmalı.",
      en: "The count must be between 1 and 1000.",
    });
  }

  const values = Array.from({ length: count }, () => {
    switch (kind) {
      case "v4":
        return crypto.randomUUID();
      case "v7":
        return uuidV7();
      case "ulid":
        return ulid();
      case "nanoid":
        return nanoid();
    }
  });

  return values
    .map((value) => (upper ? value.toUpperCase() : value))
    .join("\n");
}

/** RFC 9562 v7: 48 bits of epoch milliseconds, then randomness. */
function uuidV7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const now = BigInt(Date.now());

  for (let i = 0; i < 6; i += 1) {
    bytes[i] = Number((now >> BigInt(8 * (5 - i))) & 0xffn);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function ulid(): string {
  let timestamp = Date.now();
  let time = "";
  for (let i = 0; i < 10; i += 1) {
    time = CROCKFORD[timestamp % 32] + time;
    timestamp = Math.floor(timestamp / 32);
  }

  const random = crypto.getRandomValues(new Uint8Array(16));
  const body = Array.from(random.slice(0, 16), (byte) => CROCKFORD[byte % 32])
    .join("")
    .slice(0, 16);

  return time + body;
}

const NANO_ALPHABET =
  "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

function nanoid(size = 21): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes, (byte) => NANO_ALPHABET[byte & 63]).join("");
}

/** What the id says about itself — the reason to choose v7 over v4. */
export function inspect(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  const match =
    /^([0-9a-f]{8})-([0-9a-f]{4})-([1-8])([0-9a-f]{3})-([89ab][0-9a-f]{3})-([0-9a-f]{12})$/.exec(
      trimmed,
    );
  if (!match) return null;

  const version = Number(match[3]);
  if (version !== 7) return `UUID v${version}`;

  const ms = Number(BigInt(`0x${match[1]}${match[2]}`));
  return `UUID v7 · ${new Date(ms).toISOString()}`;
}
