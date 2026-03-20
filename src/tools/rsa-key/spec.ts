import type { GeneratorSpec } from "../generator-tool";
import { generateKeyPair, type Algorithm } from "./logic";

export const spec: GeneratorSpec = {
  generate: (options) => generateKeyPair(options.algorithm as Algorithm),
  options: [
    {
      kind: "select",
      id: "algorithm",
      label: { tr: "Algoritma", en: "Algorithm" },
      default: "RSA-2048",
      choices: [
        { value: "RSA-2048", label: { tr: "RSA 2048", en: "RSA 2048" } },
        {
          value: "RSA-4096",
          label: { tr: "RSA 4096 (yavaş)", en: "RSA 4096 (slow)" },
        },
        { value: "EC-P256", label: { tr: "EC P-256", en: "EC P-256" } },
        { value: "EC-P384", label: { tr: "EC P-384", en: "EC P-384" } },
      ],
    },
  ],
  outputExtension: "pem",
  footnote: () => ({
    tr: "Anahtar bu sekmede üretildi ve hiçbir yere gönderilmedi. Yine de: üretimde kullanacağın anahtarı orada üret.",
    en: "Generated in this tab and sent nowhere. Still: generate a production key where it will live.",
  }),
};
