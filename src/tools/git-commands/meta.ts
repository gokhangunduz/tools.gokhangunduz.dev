import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "git-commands",
  category: "reference",
  icon: "table",
  name: { tr: "Git komutları", en: "Git commands" },
  blurb: {
    tr: "Günlük kullanılan komutlar ve tam olarak ne yaptıkları — reflog ve bisect dahil.",
    en: "The commands you actually use and exactly what they do, reflog and bisect included.",
  },
  keywords: {
    tr: ["git", "komut", "rebase", "reset", "stash", "reflog", "kılavuz"],
    en: ["git", "command", "rebase", "reset", "stash", "reflog", "cheat sheet"],
  },
  related: ["docker-cli", "regex-cheatsheet"],
};
