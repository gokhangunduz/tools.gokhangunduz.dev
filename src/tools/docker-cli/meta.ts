import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "docker-cli",
  category: "reference",
  icon: "table",
  name: { tr: "Docker komutları", en: "Docker commands" },
  blurb: {
    tr: "Konteyner incelerken ve temizlik yaparken lazım olanlar — compose dahil.",
    en: "What you need while inspecting containers and cleaning up, compose included.",
  },
  keywords: {
    tr: ["docker", "compose", "konteyner", "komut", "prune", "logs"],
    en: ["docker", "compose", "container", "command", "prune", "logs"],
  },
  related: ["docker-run-compose", "git-commands"],
};
