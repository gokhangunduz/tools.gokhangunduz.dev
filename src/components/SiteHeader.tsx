"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, Search, X } from "lucide-react";
import { t, type Locale } from "@/i18n";
import CommandPalette from "@/components/CommandPalette";
import LocaleToggle from "@/components/LocaleToggle";
import Sidebar from "@/components/Sidebar";
import SiteFooter from "@/components/SiteFooter";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export const HOME_SEARCH_ID = "home-search";

export default function SiteHeader({ locale }: { locale: Locale }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = !pathname.split("/")[2];
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isHome) focusHomeSearch();
        else setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHome]);

  return (
    <header className="z-40 shrink-0 border-b bg-background">
      <div className="flex h-12 w-full items-center gap-2 px-3 sm:px-4">
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger
            aria-label={t(locale, "nav.menu")}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden",
              isHome && "hidden",
            )}
          >
            <Menu className="size-4" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r bg-background data-[state=open]:animate-in data-[state=open]:slide-in-from-left-full">
              <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
                <Dialog.Title className="font-mono text-sm font-semibold">
                  {t(locale, "app.short")}
                </Dialog.Title>
                <Dialog.Close
                  aria-label={t(locale, "nav.close")}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">
                {t(locale, "nav.allTools")}
              </Dialog.Description>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Sidebar
                  locale={locale}
                  onNavigate={() => setMenuOpen(false)}
                />
              </div>
              <SiteFooter locale={locale} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <Link
          href={`/${locale}`}
          className="font-mono text-sm font-semibold tracking-tight"
        >
          {t(locale, "app.short")}
          <span className="hidden text-muted-foreground sm:inline">
            .gokhangunduz.dev
          </span>
        </Link>

        <button
          type="button"
          onClick={() => (isHome ? focusHomeSearch() : setPaletteOpen(true))}
          className="ml-auto flex h-8 items-center gap-2 rounded-md border bg-muted/50 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:w-60"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">
            {t(locale, "nav.openPalette")}
          </span>
          {/* The shortcut is shown, not hidden in a tooltip: it is the fastest
              path to every tool and nobody guesses it. */}
          <kbd className="ml-auto hidden rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </button>

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

function focusHomeSearch() {
  const input = document.getElementById(HOME_SEARCH_ID);
  if (input instanceof HTMLInputElement) {
    input.focus();
    input.select();
  }
}
