import type { TextToolSpec } from "../text-tool";
import { lookupDomain, queryNote } from "./logic";

export const spec: TextToolSpec = {
  directions: [
    {
      id: "lookup",
      label: { tr: "Sorgula", en: "Look up" },
      sample: "example.com",
      placeholder: {
        tr: "Alan adı ya da URL yaz. Enter ile sorgula.",
        en: "Type a domain or a URL. Enter looks it up.",
      },
      run: (input, _options, locale) => lookupDomain(input, locale),
      footnote: (input) => queryNote(input),
    },
  ],
  input: "line",
  trigger: "submit",
};
