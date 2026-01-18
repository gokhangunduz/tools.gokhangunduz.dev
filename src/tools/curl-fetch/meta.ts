import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "curl-fetch",
  category: "convert",
  icon: "shuffle",
  name: { tr: "curl → fetch / axios", en: "curl → fetch / axios" },
  blurb: {
    tr: 'Tarayıcının "Copy as cURL" çıktısını çalışır JavaScript\'e çevirir; tanımadığı seçeneği sessizce atmaz.',
    en: "Turns devtools' Copy as cURL into working JavaScript, and refuses flags it does not understand.",
  },
  keywords: {
    tr: ["curl", "fetch", "axios", "istek", "http", "devtools", "çevir"],
    en: ["curl", "fetch", "axios", "request", "http", "devtools", "convert"],
  },
  related: ["json-to-types", "url-parse"],
};
