import type { TextToolSpec } from "../text-tool";
import { countMatches, testRegex, type Mode } from "./logic";

const SAMPLE = "Ali: 0532 111 22 33\nAyşe: 0545 444 55 66\nposta: ayse@x.dev";

function direction(id: Mode, tr: string, en: string) {
  return {
    id,
    label: { tr, en },
    sample: SAMPLE,
    placeholder: { tr: "Test edilecek metin", en: "Text to test against" },
    run: (input: string, options: Record<string, string | boolean>) =>
      testRegex(
        input,
        String(options.pattern),
        String(options.flags),
        id,
        String(options.replacement),
      ),
    footnote: (
      input: string,
      _output: string,
      options: Record<string, string | boolean>,
    ) => {
      const count = countMatches(
        input,
        String(options.pattern),
        String(options.flags),
      );
      return { tr: `${count} eşleşme`, en: `${count} matches` };
    },
  };
}

export const spec: TextToolSpec = {
  directions: [
    direction("matches", "Eşleşmeler", "Matches"),
    direction("highlight", "Vurgula", "Highlight"),
    direction("replace", "Değiştir", "Replace"),
    direction("split", "Böl", "Split"),
  ],
  options: [
    {
      kind: "text",
      id: "pattern",
      label: { tr: "Desen", en: "Pattern" },
      default: "\\d{4}",
      placeholder: { tr: "\\d{4}", en: "\\d{4}" },
    },
    {
      kind: "text",
      id: "flags",
      label: { tr: "Bayraklar", en: "Flags" },
      default: "g",
      placeholder: { tr: "gim", en: "gim" },
    },
    {
      kind: "text",
      id: "replacement",
      label: { tr: "Yerine", en: "Replace with" },
      default: "",
      placeholder: { tr: "$1", en: "$1" },
    },
  ],
};
