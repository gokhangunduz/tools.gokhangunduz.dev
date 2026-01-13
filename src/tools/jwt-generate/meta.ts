import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "jwt-generate",
  category: "jwt",
  icon: "keyRound",
  name: { tr: "JWT üret", en: "JWT generator" },
  blurb: {
    tr: "Bir JSON veri bölümünü HS256/384/512 ile imzalar — test isteği için token üretmek üzere.",
    en: "Signs a JSON payload with HS256/384/512 — for producing a token to test against.",
  },
  keywords: {
    tr: ["jwt", "üret", "imzala", "token", "hs256", "test", "bearer"],
    en: ["jwt", "generate", "sign", "token", "hs256", "test", "bearer"],
  },
  related: ["jwt-decode", "hmac"],
};
