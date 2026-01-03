import type { TextToolSpec } from "../text-tool";
import { describeHash, hashPassword, verifyPassword } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "hash",
      label: { tr: "Hash üret", en: "Hash" },
      placeholder: { tr: "Parola", en: "Password" },
      sample: "hunter2",
      run: (input, options) => hashPassword(input, Number(options.cost)),
      footnote: (_input, output) => {
        const cost = describeHash(output);
        return cost
          ? {
              tr: `maliyet ${cost} · her çalıştırmada tuz değişir, hash de değişir`,
              en: `cost ${cost} · the salt is new each run, so the hash is too`,
            }
          : null;
      },
    },
    {
      id: "verify",
      label: { tr: "Doğrula", en: "Verify" },
      placeholder: { tr: "Parola", en: "Password" },
      sample: "hunter2",
      run: (input, options) => verifyPassword(input, String(options.hash)),
    },
  ],
  options: [
    {
      kind: "select",
      id: "cost",
      label: { tr: "Maliyet", en: "Cost" },
      default: "10",
      choices: ["8", "10", "12", "14"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "text",
      id: "hash",
      label: { tr: "Hash (doğrulama için)", en: "Hash (to verify against)" },
      default: "",
      placeholder: { tr: "$2b$10$…", en: "$2b$10$…" },
    },
  ],
};
