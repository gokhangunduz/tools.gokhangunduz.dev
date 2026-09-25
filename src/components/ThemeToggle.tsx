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

/**
 * Cycles light → dark → system.
 *
 * One button rather than a menu: it is the only setting on the page besides
 * the language, and a dropdown for three states costs a click every time. The
 * icon says which state is current, and the title spells it out.
 *
 * `null` until mounted, because the preference lives in localStorage and the
 * server cannot know it; rendering a sun on the server and a moon a frame
 * later is exactly the flicker the inline script exists to avoid.
 */
export default function ThemeToggle({ locale }: { locale: Locale }) {
  // `null` on the server and for the first client render: the preference lives
  // in localStorage, and painting a sun that becomes a moon a frame later is
  // exactly the flicker the inline script in <head> exists to prevent.
  const pref = useSyncExternalStore<ThemePref | null>(
    subscribePref,
    readPref,
    () => null,
  );

  // While the preference is `system`, the OS flipping at sunset must move the
  // page with it. An explicit light or dark must not.
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
