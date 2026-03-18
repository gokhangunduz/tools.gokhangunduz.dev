import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "password",
  category: "generate",
  icon: "braces",
  name: { tr: "Parola üret", en: "Password generator" },
  blurb: {
    tr: "Yanında entropisini ve kırılma süresini yazar; karakterler sapmasız seçilir.",
    en: "Prints the entropy and the crack time beside it, with unbiased character selection.",
  },
  keywords: {
    tr: ["parola", "şifre", "rastgele", "güvenlik", "entropi", "üret"],
    en: ["password", "passphrase", "random", "security", "entropy", "generate"],
  },
  related: ["uuid", "bcrypt"],
};
