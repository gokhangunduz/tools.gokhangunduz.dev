import type { TextToolSpec } from "../text-tool";
import { ALGORITHMS, signToken, type Algorithm } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "sign",
      label: { tr: "İmzala", en: "Sign" },
      sample:
        '{\n  "sub": "42",\n  "name": "Gökhan Gündüz",\n  "role": "admin"\n}',
      placeholder: {
        tr: "Veri bölümü (JSON nesnesi)",
        en: "Payload (a JSON object)",
      },
      run: (input, options) =>
        signToken(
          input,
          String(options.secret),
          options.algorithm as Algorithm,
          String(options.expiresIn),
        ),
      footnote: () => ({
        tr: "iat otomatik eklenir. Yalnız HS* — özel anahtar bu sayfaya yapıştırılmamalı.",
        en: "iat is added for you. HS* only — a private key does not belong in a web page.",
      }),
    },
  ],
  options: [
    {
      kind: "text",
      id: "secret",
      label: { tr: "Gizli anahtar", en: "Secret" },
      default: "",
      placeholder: { tr: "en az 32 karakter", en: "32 characters or more" },
    },
    {
      kind: "select",
      id: "algorithm",
      label: { tr: "Algoritma", en: "Algorithm" },
      default: "HS256",
      choices: ALGORITHMS.map((name) => ({
        value: name,
        label: { tr: name, en: name },
      })),
    },
    {
      kind: "text",
      id: "expiresIn",
      label: { tr: "Geçerlilik", en: "Lifetime" },
      default: "2h",
      placeholder: { tr: "2h, 30m, 7d", en: "2h, 30m, 7d" },
    },
  ],
};
