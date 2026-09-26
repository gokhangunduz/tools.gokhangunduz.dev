import type { TextToolSpec } from "../text-tool";
import {
  lookup,
  RECORD_TYPES,
  recordCount,
  targetNote,
  type Query,
} from "./logic";

const QUERIES: { id: Query; label: { tr: string; en: string } }[] = [
  { id: "ALL", label: { tr: "Tümü", en: "All" } },
  ...RECORD_TYPES.map((type) => ({ id: type, label: { tr: type, en: type } })),
];

export const spec: TextToolSpec = {
  directions: QUERIES.map(({ id, label }) => ({
    id,
    label,
    sample: id === "PTR" ? "8.8.8.8" : id === "MX" ? "gmail.com" : "github.com",
    placeholder: {
      tr: "Alan adı, URL ya da IP yaz. Enter ile sorgula.",
      en: "Type a domain, a URL or an IP. Enter looks it up.",
    },
    run: (input, _options, locale) => lookup(input, id, locale),
    headline: (output) => {
      const count = recordCount(output);
      return count ? { text: count } : null;
    },
    footnote: (input) => targetNote(input),
  })),
  input: "line",
  trigger: "submit",
};
