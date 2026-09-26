import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "jwt-decode",
  category: "encode",
  icon: "fileKey",
  name: { tr: "JWT decode / verify", en: "JWT decode / verify" },
  blurb: {
    tr: "Token'ı key olmadan okur, timestamp'leri tarihe çevirir; istersen signature'ı da verify eder.",
    en: "Reads a token without any key and turns its timestamps into dates; verifies the signature if you give one.",
  },
  keywords: {
    tr: [
      "jwt",
      "token",
      "çöz",
      "decode",
      "doğrula",
      "verify",
      "bearer",
      "oauth",
      "exp",
      "imza",
      "signature",
      "claims",
    ],
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
};
