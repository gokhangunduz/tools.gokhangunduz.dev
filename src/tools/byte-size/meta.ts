import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "byte-size",
  category: "number",
  icon: "hash",
  name: { tr: "Bayt birimleri", en: "Byte sizes" },
  blurb: {
    tr: "MB ile MiB'yi yan yana verir — 1 TB'lık diskin neden 931 GiB göründüğünü açıklayan fark.",
    en: "MB against MiB side by side — the gap that makes a 1 TB disk show as 931 GiB.",
  },
  keywords: {
    tr: ["bayt", "byte", "kb", "mb", "gb", "mib", "gib", "boyut", "dosya"],
    en: ["byte", "kb", "mb", "gb", "mib", "gib", "size", "file", "storage"],
  },
  related: ["number-base", "gzip"],
};
