import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "bcrypt",
  category: "crypto",
  icon: "fingerprint",
  name: { tr: "bcrypt hash / doğrula", en: "bcrypt hash / verify" },
  blurb: {
    tr: "Parolayı bcrypt ile hash'ler ya da bir hash ile eşleşip eşleşmediğine bakar.",
    en: "Hashes a password with bcrypt, or checks one against an existing hash.",
  },
  keywords: {
    tr: ["bcrypt", "parola", "şifre", "hash", "doğrula", "cost", "tuz"],
    en: ["bcrypt", "password", "hash", "verify", "cost", "salt"],
  },
  related: ["hash-text", "password-generate"],
};
