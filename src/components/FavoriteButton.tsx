"use client";

import { Star } from "lucide-react";
import { t, type Locale } from "@/i18n";
import { useFavorites } from "@/lib/storage";
import { cn } from "@/lib/utils";

/** The star on a tool page, kept in step with the one on its card. */
export default function FavoriteButton({
  locale,
  toolId,
}: {
  locale: Locale;
  toolId: string;
}) {
  const { favorites, toggle } = useFavorites();
  const starred = favorites.includes(toolId);

  return (
    <button
      type="button"
      onClick={() => toggle(toolId)}
      aria-pressed={starred}
      title={t(locale, starred ? "tool.unfavorite" : "tool.favorite")}
      aria-label={t(locale, starred ? "tool.unfavorite" : "tool.favorite")}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
    >
      <Star className={cn("size-4", starred && "fill-current text-warning")} />
    </button>
  );
}
