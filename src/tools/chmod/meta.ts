import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "chmod",
  category: "number",
  icon: "hash",
  name: { tr: "chmod izinleri", en: "chmod permissions" },
  blurb: {
    tr: "755 ile rwxr-xr-x arasında çevirir; ls -l çıktısını da olduğu gibi kabul eder.",
    en: "Converts between 755 and rwxr-xr-x, and accepts what ls -l prints as it is.",
  },
  keywords: {
    tr: ["chmod", "izin", "permission", "unix", "linux", "755", "rwx"],
    en: ["chmod", "permission", "unix", "linux", "755", "rwx", "file mode"],
  },
  related: ["number-base"],
};
