import type { TextToolSpec } from "../text-tool";
import { compute, type Operation } from "./logic";

const OPERATIONS: { id: Operation; label: string }[] = [
  { id: "and", label: "AND &" },
  { id: "or", label: "OR |" },
  { id: "xor", label: "XOR ^" },
  { id: "not", label: "NOT ~" },
  { id: "shl", label: "<<" },
  { id: "shr", label: ">>" },
  { id: "ushr", label: ">>>" },
];

export const spec: TextToolSpec = {
  directions: OPERATIONS.map((operation) => ({
    id: operation.id,
    label: { tr: operation.label, en: operation.label },
    sample: operation.id === "not" ? "0xff" : "0b1100 0b1010",
    placeholder: {
      tr: "İki değer, arada boşluk",
      en: "Two values, separated by a space",
    },
    run: (input) => compute(input, operation.id),
  })),
};
