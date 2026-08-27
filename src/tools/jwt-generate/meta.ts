import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "jwt-generate",
  category: "crypto",
  icon: "stamp",
  name: { tr: "JWT generator", en: "JWT generator" },
  blurb: {
    tr: "Bir JSON payload'ı HS256/384/512 ile sign eder — test request'leri için token üretmek üzere.",
    en: "Signs a JSON payload with HS256/384/512 — for producing a token to test against.",
  },
  keywords: {
    tr: [
      "jwt",
      "üret",
      "generate",
      "imzala",
      "sign",
      "token",
      "hs256",
      "test",
      "bearer",
    ],
    en: ["jwt", "generate", "sign", "token", "hs256", "test", "bearer"],
  },
};
