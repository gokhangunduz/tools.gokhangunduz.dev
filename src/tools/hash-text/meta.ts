import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "hash-text",
  category: "crypto",
  icon: "fingerprint",
  name: { tr: "Hash hesapla", en: "Hash text" },
  blurb: {
    tr: "MD5, SHA-1, SHA-256/384/512, SHA-3 ve CRC32 bir arada; beklenen hash'le karşılaştırır.",
    en: "MD5, SHA-1, SHA-256/384/512, SHA-3 and CRC32 side by side, checked against an expected hash.",
  },
  keywords: {
    tr: [
      "hash",
      "özet",
      "digest",
      "md5",
      "sha",
      "sha256",
      "checksum",
      "crc32",
      "sağlama",
    ],
    en: ["hash", "digest", "md5", "sha", "sha256", "checksum", "crc32"],
  },
};
