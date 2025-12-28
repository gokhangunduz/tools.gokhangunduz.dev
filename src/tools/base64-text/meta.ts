import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "base64-text",
  category: "encode",
  icon: "binary",
  name: { tr: "Base64 kodla / çöz", en: "Base64 encode / decode" },
  blurb: {
    tr: "Metni Base64'e çevir, Base64'ü metne çöz. UTF-8 ve URL-safe alfabe desteklenir.",
    en: "Turn text into Base64 and back. UTF-8 throughout, with the URL-safe alphabet.",
  },
  keywords: {
    tr: ["base64", "kodla", "çöz", "encode", "decode", "b64", "url safe"],
    en: ["base64", "encode", "decode", "b64", "url safe", "atob", "btoa"],
  },
  related: ["url-encode"],
};
