import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "aes",
  category: "crypto",
  icon: "keyRound",
  name: { tr: "AES şifrele / çöz", en: "AES encrypt / decrypt" },
  blurb: {
    tr: "Parolayla AES-GCM. Anahtar PBKDF2 ile türetilir, veri bozulursa çözme başarısız olur.",
    en: "AES-GCM with a passphrase. The key comes from PBKDF2, and tampering makes it fail.",
  },
  keywords: {
    tr: ["aes", "şifrele", "çöz", "gcm", "parola", "kripto", "pbkdf2"],
    en: ["aes", "encrypt", "decrypt", "gcm", "passphrase", "crypto", "pbkdf2"],
  },
  related: ["hash-text", "password-generate"],
};
