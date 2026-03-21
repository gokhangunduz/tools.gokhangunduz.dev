import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "totp",
  category: "crypto",
  icon: "keyRound",
  name: { tr: "TOTP kodu üret", en: "TOTP code" },
  blurb: {
    tr: "Base32 gizli anahtardan, doğrulayıcı uygulamanın göstereceği kodun aynısını hesaplar.",
    en: "Computes the same six digits your authenticator app would be showing, from the base32 secret.",
  },
  keywords: {
    tr: ["totp", "2fa", "otp", "doğrulayıcı", "google authenticator", "kod"],
    en: ["totp", "2fa", "otp", "authenticator", "google authenticator", "code"],
  },
  related: ["hmac", "password"],
};
