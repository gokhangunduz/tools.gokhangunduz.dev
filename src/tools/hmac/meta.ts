import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "hmac",
  category: "crypto",
  icon: "fingerprint",
  name: { tr: "HMAC imzala", en: "HMAC signature" },
  blurb: {
    tr: "Bir mesajı gizli anahtarla imzalar — webhook imzalarını doğrulamak için.",
    en: "Signs a message with a secret key — for checking webhook signatures.",
  },
  keywords: {
    tr: ["hmac", "imza", "webhook", "sha256", "anahtar", "doğrula"],
    en: ["hmac", "signature", "webhook", "sha256", "secret", "sign"],
  },
  related: ["hash-text", "jwt-decode"],
};
