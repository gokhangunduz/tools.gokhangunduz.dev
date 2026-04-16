import type { TextToolSpec } from "../text-tool";
import { decrypt, encrypt } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "encrypt",
      label: { tr: "Şifrele", en: "Encrypt" },
      sample: "Bu not sadece parolayı bilenlerce okunabilir.",
      sampleOptions: { passphrase: "ornek-parola" },
      run: (input, options) => encrypt(input, String(options.passphrase)),
      footnote: () => ({
        tr: "Çıktı: tuz ‖ iv ‖ şifreli veri, tek Base64 blok. Her şifrelemede farklıdır.",
        en: "Output: salt ‖ iv ‖ ciphertext as one Base64 blob. Different every time.",
      }),
    },
    {
      id: "decrypt",
      label: { tr: "Çöz", en: "Decrypt" },
      placeholder: {
        tr: "Bu araçla üretilmiş Base64 blok",
        en: "A Base64 blob produced by this tool",
      },
      run: (input, options) => decrypt(input, String(options.passphrase)),
    },
  ],
  options: [
    {
      kind: "text",
      id: "passphrase",
      label: { tr: "Parola", en: "Passphrase" },
      default: "",
      placeholder: { tr: "parola", en: "passphrase" },
    },
  ],
};
