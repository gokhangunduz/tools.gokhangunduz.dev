import type { IconName } from "./icons";
import type { Locale, Localized } from "@/i18n";

export type CategoryId =
  "encode" | "data" | "text" | "crypto" | "time" | "network" | "image";

export type Category = {
  id: CategoryId;
  name: Localized;
  icon: IconName;
};

export type ToolMeta = {
  id: string;
  category: CategoryId;
  name: Localized;

  blurb: Localized;

  keywords: Record<Locale, string[]>;
  icon: IconName;

  network?: boolean;

  networkService?: string;

  weight?: number;
};
