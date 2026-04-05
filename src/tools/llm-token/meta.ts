import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "llm-token",
  category: "number",
  icon: "hash",
  name: { tr: "LLM token say", en: "LLM token counter" },
  blurb: {
    tr: "Bir metnin kaç token tuttuğunu sayar; Türkçe'nin İngilizce'den neden pahalı olduğunu da gösterir.",
    en: "Counts the tokens in a text, and shows why Turkish costs more than English.",
  },
  keywords: {
    tr: ["token", "llm", "gpt", "claude", "maliyet", "bağlam", "tokenizer"],
    en: ["token", "llm", "gpt", "claude", "cost", "context", "tokenizer"],
  },
  related: ["text-stats", "byte-size"],
};
