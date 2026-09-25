import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "semver",
  category: "number",
  icon: "hash",
  name: { tr: "Semver çözümle", en: "Semver tools" },
  blurb: {
    tr: "Sürümü parçalar, aralığa uyup uymadığını söyler, sıralar ve artırır — ^0.2.3'ün tuzağı dahil.",
    en: "Parses a version, checks it against a range, sorts and increments — the ^0.2.3 trap included.",
  },
  keywords: {
    tr: ["semver", "sürüm", "version", "npm", "caret", "tilde", "aralık"],
    en: ["semver", "version", "npm", "caret", "tilde", "range", "satisfies"],
  },
  related: ["number-base"],
};
