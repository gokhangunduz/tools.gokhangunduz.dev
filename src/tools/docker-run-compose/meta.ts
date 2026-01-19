import type { ToolMeta } from "../types";

export const meta: ToolMeta = {
  id: "docker-run-compose",
  category: "convert",
  icon: "shuffle",
  name: { tr: "docker run → compose", en: "docker run → compose" },
  blurb: {
    tr: "Komutu compose servisine çevirir; portları tırnaklar, karşılığı olmayan bayrakta durur.",
    en: "Turns the command into a compose service, quotes the ports, and stops on a flag with no equivalent.",
  },
  keywords: {
    tr: ["docker", "compose", "run", "konteyner", "yaml", "çevir", "servis"],
    en: ["docker", "compose", "run", "container", "yaml", "convert", "service"],
  },
  related: ["json-yaml", "env-json"],
};
