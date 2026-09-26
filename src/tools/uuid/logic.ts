import type { Localized } from "@/i18n";
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
export type ListFormat = "lines" | "json" | "comma" | "sql";

export function generateIds(
  kind: Kind,
  count: number,
  { upper = false, dashes = true }: { upper?: boolean; dashes?: boolean } = {},
): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    throw new ToolError(
      {
        tr: "Adet 1 ile 1000 arasında bir tam sayı olmalı.",
        en: "The count must be a whole number between 1 and 1000.",
      },
      { field: "count" },
    );
  }

  return Array.from({ length: count }, () => {
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
  }).map((value) => {
    if (kind !== "v4" && kind !== "v7") return value;
    const shaped = dashes ? value : value.replace(/-/g, "");
    return upper ? shaped.toUpperCase() : shaped;
  });
}

export function formatIds(ids: string[], format: ListFormat): string {
  switch (format) {
    case "json":
      return JSON.stringify(ids, null, 2);
    case "comma":
      return ids.join(", ");
    case "sql":
      return `IN (${ids.map((id) => `'${id}'`).join(", ")})`;
    default:
      return ids.join("\n");
  }
}

const v7State = { ms: -1, counter: 0 };

/**
 * RFC 9562 v7 with the §6.2 counter: within one millisecond the 12-bit
 * rand_a is incremented rather than redrawn, so ids from one burst still sort
 * in the order they were made. It starts below 0x800 to leave room to count.
 */
function uuidV7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let ms = Date.now();
  let counter: number;
  if (ms <= v7State.ms) {
    ms = v7State.ms;
    counter = v7State.counter + 1;
    if (counter > 0xfff) {
      ms += 1;
      counter = ((bytes[6] << 8) | bytes[7]) & 0x7ff;
    }
  } else {
    counter = ((bytes[6] << 8) | bytes[7]) & 0x7ff;
  }
  v7State.ms = ms;
  v7State.counter = counter;

  const now = BigInt(ms);
  for (let i = 0; i < 6; i += 1) {
    bytes[i] = Number((now >> BigInt(8 * (5 - i))) & 0xffn);
  }
  bytes[6] = 0x70 | (counter >> 8);
  bytes[7] = counter & 0xff;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const RANDOM_MAX = (1n << 80n) - 1n;
const ulidState = { ms: -1, random: 0n };

/** Monotonic ULID: the same millisecond increments the 80-bit random part. */
function ulid(): string {
  let ms = Date.now();
  let random: bigint;
  if (ms <= ulidState.ms) {
    ms = ulidState.ms;
    random = ulidState.random + 1n;
    if (random > RANDOM_MAX) {
      ms += 1;
      random = randomBits80();
    }
  } else {
    random = randomBits80();
  }
  ulidState.ms = ms;
  ulidState.random = random;

  let time = "";
  let timestamp = ms;
  for (let i = 0; i < 10; i += 1) {
    time = CROCKFORD[timestamp % 32] + time;
    timestamp = Math.floor(timestamp / 32);
  }

  let body = "";
  for (let i = 0; i < 16; i += 1) {
    body = CROCKFORD[Number(random & 31n)] + body;
    random >>= 5n;
  }
  return time + body;
}

function randomBits80(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return bytes.reduce((total, byte) => (total << 8n) | BigInt(byte), 0n);
}

const NANO_ALPHABET =
  "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

function nanoid(size = 21): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes, (byte) => NANO_ALPHABET[byte & 63]).join("");
}

export type Inspection =
  | { valid: false }
  | {
      valid: true;
      kind: "uuid" | "ulid";
      version: Localized;
      variant?: Localized;
      time?: Date;
    };

const VARIANTS: [RegExp, Localized][] = [
  [/^[0-7]$/, { tr: "NCS (eski)", en: "NCS (legacy)" }],
  [/^[89ab]$/, { tr: "RFC 9562", en: "RFC 9562" }],
  [/^[cd]$/, { tr: "Microsoft (eski)", en: "Microsoft (legacy)" }],
  [/^[ef]$/, { tr: "Ayrılmış", en: "Reserved" }],
];

/** What the id says about itself — the reason to choose v7 over v4. */
export function inspect(value: string): Inspection | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hex = trimmed
    .toLowerCase()
    .replace(/^urn:uuid:/, "")
    .replace(/^\{(.*)\}$/, "$1");
  const uuid =
    /^([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f])([0-9a-f]{3})-?([0-9a-f])([0-9a-f]{3})-?([0-9a-f]{12})$/.exec(
      hex,
    );
  if (uuid) {
    const compact = hex.replace(/-/g, "");
    if (/^0+$/.test(compact)) {
      return {
        valid: true,
        kind: "uuid",
        version: { tr: "Nil UUID", en: "Nil UUID" },
      };
    }
    if (/^f+$/.test(compact)) {
      return {
        valid: true,
        kind: "uuid",
        version: { tr: "Max UUID", en: "Max UUID" },
      };
    }
    const version = Number.parseInt(uuid[3], 16);
    const variant = VARIANTS.find(([pattern]) => pattern.test(uuid[5]))![1];
    const known = version >= 1 && version <= 8;
    return {
      valid: true,
      kind: "uuid",
      version: known
        ? { tr: `UUID v${version}`, en: `UUID v${version}` }
        : {
            tr: `Bilinmeyen sürüm (${version})`,
            en: `Unknown version (${version})`,
          },
      variant,
      time:
        version === 7
          ? new Date(Number.parseInt(`${uuid[1]}${uuid[2]}`, 16))
          : undefined,
    };
  }

  const upper = trimmed.toUpperCase();
  if (/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/.test(upper)) {
    let ms = 0;
    for (const character of upper.slice(0, 10)) {
      ms = ms * 32 + CROCKFORD.indexOf(character);
    }
    return {
      valid: true,
      kind: "ulid",
      version: { tr: "ULID", en: "ULID" },
      time: new Date(ms),
    };
  }

  return { valid: false };
}

const UUID_PATTERN =
  /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i;
const ULID_PATTERN = /[0-9A-HJKMNP-TV-Z]{26}/;

/** The line under the list: what the chosen format is good for, or when the first id was made. */
export function footnoteFor(kind: Kind, output: string): Localized {
  if (kind === "v4") {
    return {
      tr: "v4 rastgeledir; primary key olacaksa v7 ya da ULID index'i daha az böler.",
      en: "v4 is random; as a primary key, v7 or ULID fragments the index less.",
    };
  }
  if (kind === "nanoid") {
    return {
      tr: "21 karakter, 126 bit rastgelelik; URL'de kaçış gerektirmez.",
      en: "21 characters, 126 random bits; safe in a URL without escaping.",
    };
  }
  const first = (kind === "ulid" ? ULID_PATTERN : UUID_PATTERN).exec(
    output,
  )?.[0];
  const found = first ? inspect(first) : null;
  const time = found?.valid ? found.time : undefined;
  if (!time) {
    return {
      tr: "Zamana göre sıralanır; ilk 48 bit milisaniye cinsinden zaman damgası.",
      en: "Sorts by time; the first 48 bits are a millisecond timestamp.",
    };
  }
  return {
    tr: `Zaman damgası ${time.toISOString()} · zamana göre sıralanır`,
    en: `Timestamp ${time.toISOString()} · sorts by time`,
  };
}
