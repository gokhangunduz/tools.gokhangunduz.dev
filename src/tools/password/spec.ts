import type { GeneratorSpec } from "../generator-tool";
import type { OptionValues } from "../text-tool";
import {
  crackTime,
  entropyBits,
  generatePasswords,
  SAFE_SYMBOLS,
  SETS,
  strength,
  type Options,
} from "./logic";

function read(values: OptionValues): Options {
  const symbolSet =
    values.safe === true
      ? SAFE_SYMBOLS
      : typeof values.symbolSet === "string"
        ? values.symbolSet
        : SETS.symbols;
  return {
    length: Number(String(values.length).trim() || NaN),
    count: Number(values.count),
    lower: values.lower !== false,
    upper: values.upper !== false,
    digits: values.digits !== false,
    symbols: values.symbols !== false,
    avoidAmbiguous: values.avoidAmbiguous === true,
    symbolSet,
  };
}

export const spec: GeneratorSpec = {
  generate: (values) => generatePasswords(read(values)),
  options: [
    {
      kind: "text",
      id: "length",
      label: { tr: "Uzunluk", en: "Length" },
      default: "20",
      width: "sm",
      hint: { tr: "4 ile 256 arası", en: "Between 4 and 256" },
    },
    {
      kind: "select",
      id: "count",
      label: { tr: "Adet", en: "Count" },
      default: "1",
      choices: ["1", "5", "10", "25"].map((value) => ({
        value,
        label: { tr: value, en: value },
      })),
    },
    {
      kind: "switch",
      id: "lower",
      label: { tr: "a-z", en: "a-z" },
      default: true,
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
      hint: {
        tr: `Semboller: ${SETS.symbols}`,
        en: `Symbols: ${SETS.symbols}`,
      },
    },
    {
      kind: "switch",
      id: "safe",
      label: { tr: "URL/shell-safe", en: "URL/shell-safe" },
      default: false,
      hint: {
        tr: `Yalnız ${SAFE_SYMBOLS}: URL'de ve shell'de kaçış gerektirmez`,
        en: `Only ${SAFE_SYMBOLS}: needs no escaping in a URL or a shell`,
      },
      visibleWhen: (values) => values.symbols !== false,
    },
    {
      kind: "text",
      id: "symbolSet",
      label: { tr: "Semboller", en: "Symbols" },
      default: SETS.symbols,
      width: "md",
      visibleWhen: (values) => values.symbols !== false && values.safe !== true,
    },
    {
      kind: "switch",
      id: "avoidAmbiguous",
      label: { tr: "I l 1 O 0 kullanma", en: "Avoid I l 1 O 0" },
      default: false,
    },
  ],
  headline: (_output, values) => {
    const bits = entropyBits(read(values));
    const rating = strength(bits);
    return {
      text: {
        tr: `${rating.text.tr} · ${bits} bit`,
        en: `${rating.text.en} · ${bits} bits`,
      },
      tone: rating.tone,
    };
  },
  footnote: (_output, values) => {
    const bits = entropyBits(read(values));
    return {
      tr: `${bits} bit entropi · brute force ile ${crackTime(bits, "tr")}`,
      en: `${bits} bits of entropy · brute force: ${crackTime(bits, "en")}`,
    };
  },
};
