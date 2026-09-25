import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "hash-text",
  category: "crypto",
  icon: "fingerprint",
  name: { tr: "Hash hesapla", en: "Hash text" },
  blurb: {
    tr: "MD5, SHA-1, SHA-256/384/512, SHA-3 ve CRC32 — tek tek ya da hepsi birden.",
    en: "MD5, SHA-1, SHA-256/384/512, SHA-3 and CRC32 — one at a time or all at once.",
  },
  keywords: {
    tr: [
      "hash",
      "özet",
      "md5",
      "sha",
      "sha256",
      "checksum",
      "crc32",
      "sağlama",
    ],
    en: ["hash", "digest", "md5", "sha", "sha256", "checksum", "crc32"],
  },
  related: ["hmac", "bcrypt"],
};
