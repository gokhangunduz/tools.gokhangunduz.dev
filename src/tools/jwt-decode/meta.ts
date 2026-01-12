import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "jwt-decode",
  category: "jwt",
  icon: "keyRound",
  name: { tr: "JWT çöz / doğrula", en: "JWT decode / verify" },
  blurb: {
    tr: "Token'ı anahtarsız okur, zaman damgalarını tarihe çevirir; istersen imzayı da doğrular.",
    en: "Reads a token without any key and turns its timestamps into dates; verifies the signature if you give one.",
  },
  keywords: {
    tr: ["jwt", "token", "çöz", "doğrula", "bearer", "oauth", "exp", "imza"],
    en: [
      "jwt",
      "token",
      "decode",
      "verify",
      "bearer",
      "oauth",
      "exp",
      "claims",
    ],
  },
  related: ["jwt-generate", "base64-text", "hmac"],
};
