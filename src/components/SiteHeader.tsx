"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { t, type Locale } from "@/i18n";
import { TOOLS } from "@/tools/registry";
import CommandPalette from "@/components/CommandPalette";
import LocaleToggle from "@/components/LocaleToggle";
import ThemeToggle from "@/components/ThemeToggle";

export default function SiteHeader({ locale }: { locale: Locale }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="font-mono text-sm font-semibold tracking-tight"
        >
          {t(locale, "app.short")}
          <span className="text-muted-foreground">.gokhangunduz.dev</span>
        </Link>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="ml-auto flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">
            {t(locale, "nav.openPalette")}
          </span>
          {/* The shortcut is shown, not hidden in a tooltip: it is the fastest
              path to every tool and nobody guesses it. */}
          <kbd className="hidden rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </button>

        <span className="hidden text-xs text-muted-foreground tabular lg:inline">
          {t(locale, "nav.toolCount", { count: TOOLS.length })}
        </span>

        <LocaleToggle locale={locale} />
        <ThemeToggle locale={locale} />
      </div>

      <CommandPalette
        locale={locale}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </header>
  );
}
