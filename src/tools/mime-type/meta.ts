import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "mime-type",
  category: "reference",
  icon: "table",
  name: { tr: "MIME türleri", en: "MIME types" },
  blurb: {
    tr: "Content-Type başlığına elle yazılan türler ve karşılık geldikleri uzantılar.",
    en: "The media types that get typed into a Content-Type header, and their extensions.",
  },
  keywords: {
    tr: ["mime", "content-type", "medya türü", "uzantı", "dosya"],
    en: ["mime", "content-type", "media type", "extension", "file"],
  },
  related: ["http-status", "image-base64"],
};
