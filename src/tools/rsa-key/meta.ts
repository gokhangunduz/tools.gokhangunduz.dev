import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "rsa-key",
  category: "generate",
  icon: "keyRound",
  name: { tr: "Anahtar çifti üret", en: "Key pair generator" },
  blurb: {
    tr: "RSA ya da EC anahtar çiftini PEM olarak üretir — tarayıcıda, WebCrypto ile.",
    en: "An RSA or EC key pair as PEM, generated in the browser with WebCrypto.",
  },
  keywords: {
    tr: [
      "rsa",
      "ec",
      "anahtar",
      "pem",
      "açık anahtar",
      "özel anahtar",
      "jwt",
      "üret",
    ],
    en: [
      "rsa",
      "ec",
      "key pair",
      "pem",
      "public key",
      "private key",
      "jwt",
      "generate",
    ],
  },
  related: ["jwt-generate", "aes"],
};
