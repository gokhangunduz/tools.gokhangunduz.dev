import type { TextToolSpec } from "../text-tool";
import { secondsRemaining, totp } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "code",
      label: { tr: "Kod üret", en: "Current code" },
      sample: "JBSWY3DPEHPK3PXP",
      placeholder: {
        tr: "Base32 gizli anahtar",
        en: "Base32 secret",
      },
      run: (input, options) =>
        totp(input, {
          digits: Number(options.digits),
          period: Number(options.period),
          algorithm: options.algorithm as "SHA-1" | "SHA-256" | "SHA-512",
        }),
      footnote: (_input, _output, options) => {
        const left = secondsRemaining(Number(options.period));
        return {
          tr: `bu kod ~${left} sn geçerli · yenilemek için bir tuşa dokun`,
          en: `valid for about ${left}s · edit anything to recompute`,
        };
      },
    },
  ],
  options: [
    {
      kind: "select",
      id: "digits",
      label: { tr: "Basamak", en: "Digits" },
      default: "6",
      choices: ["6", "8"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "select",
      id: "period",
      label: { tr: "Süre", en: "Period" },
      default: "30",
      choices: ["30", "60"].map((value) => ({
        value,
        label: { tr: `${value} sn`, en: `${value}s` },
      })),
    },
    {
      kind: "select",
      id: "algorithm",
      label: { tr: "Algoritma", en: "Algorithm" },
      default: "SHA-1",
      choices: ["SHA-1", "SHA-256", "SHA-512"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
  ],
};
