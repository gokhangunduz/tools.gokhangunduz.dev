import type { TextToolSpec } from "../text-tool";
import { HMAC_HASHES, hmac, type HmacHash, type Output } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "sign",
      label: { tr: "İmzala", en: "Sign" },
      sample: '{"event":"payment.succeeded","id":"evt_123"}',
      placeholder: { tr: "İmzalanacak mesaj", en: "Message to sign" },
      run: (input, options) =>
        hmac(
          input,
          String(options.secret),
          options.hash as HmacHash,
          options.output as Output,
        ),
    },
  ],
  options: [
    {
      kind: "text",
      id: "secret",
      label: { tr: "Anahtar", en: "Key" },
      default: "",
      placeholder: { tr: "gizli anahtar", en: "secret key" },
    },
    {
      kind: "select",
      id: "hash",
      label: { tr: "Hash", en: "Hash" },
      default: "SHA-256",
      choices: HMAC_HASHES.map((name) => ({
        value: name,
        label: { tr: name, en: name },
      })),
    },
    {
      kind: "select",
      id: "output",
      label: { tr: "Çıktı", en: "Output" },
      default: "hex",
      choices: [
        { value: "hex", label: { tr: "hex", en: "hex" } },
        { value: "base64", label: { tr: "base64", en: "base64" } },
      ],
    },
  ],
};
