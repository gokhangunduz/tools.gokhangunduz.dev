import type { GeneratorSpec } from "../generator-tool";
import { crackTime, entropyBits, generatePasswords } from "./logic";

function read(values: Record<string, string | boolean>) {
  return {
    length: Number(values.length),
    count: Number(values.count),
    lower: values.lower !== false,
    upper: values.upper !== false,
    digits: values.digits !== false,
    symbols: values.symbols !== false,
    avoidAmbiguous: values.avoidAmbiguous === true,
  };
}

export const spec: GeneratorSpec = {
  generate: (values) => generatePasswords(read(values)),
  options: [
    {
      kind: "select",
      id: "length",
      label: { tr: "Uzunluk", en: "Length" },
      default: "20",
      choices: ["12", "16", "20", "32", "64"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "select",
      id: "count",
      label: { tr: "Adet", en: "Count" },
      default: "5",
      choices: ["1", "5", "10", "25"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "switch",
      id: "upper",
      label: { tr: "A-Z", en: "A-Z" },
      default: true,
    },
    {
      kind: "switch",
      id: "digits",
      label: { tr: "0-9", en: "0-9" },
      default: true,
    },
    {
      kind: "switch",
      id: "symbols",
      label: { tr: "!@#", en: "!@#" },
      default: true,
    },
    {
      kind: "switch",
      id: "avoidAmbiguous",
      label: { tr: "I l 1 O 0 kullanma", en: "Avoid I l 1 O 0" },
      default: false,
    },
  ],
  footnote: (_output, values) => {
    const options = read(values);
    const bits = entropyBits(options);
    return {
      tr: `${bits} bit entropi · kaba kuvvetle ~${crackTime(bits, "tr")}`,
      en: `${bits} bits of entropy · brute force ≈ ${crackTime(bits, "en")}`,
    };
  },
};
