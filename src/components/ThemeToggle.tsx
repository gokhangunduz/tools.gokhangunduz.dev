"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  applyPref,
  readPref,
  subscribePref,
  watchSystem,
  type ThemePref,
} from "@/lib/theme";
import { t, type Locale } from "@/i18n";
import { cn } from "@/lib/utils";

const ORDER: ThemePref[] = ["light", "dark", "system"];
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const;

export default function ThemeToggle({ locale }: { locale: Locale }) {
  const pref = useSyncExternalStore<ThemePref | null>(
    subscribePref,
    readPref,
    () => null,
  );

  useEffect(() => {
    if (pref !== "system") return;
    return watchSystem(() => applyPref("system"));
  }, [pref]);

  const Icon = pref ? ICONS[pref] : Sun;
  const label = pref ? t(locale, `theme.${pref}`) : t(locale, "theme.label");

  return (
    <button
      type="button"
      title={`${t(locale, "theme.label")}: ${label}`}
      aria-label={`${t(locale, "theme.label")}: ${label}`}
      onClick={() => {
        applyPref(ORDER[(ORDER.indexOf(pref ?? "system") + 1) % ORDER.length]);
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
